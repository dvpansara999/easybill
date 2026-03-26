"use client"

import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { getActiveUserId } from "@/lib/auth"
import { getAuthMode } from "@/lib/runtimeMode"
import { buildLogoStoragePath, getOwnedLogoStoragePath, LOGO_BUCKET } from "@/lib/logoStorage"
import { validateLogoFile, MAX_LOGO_UPLOAD_BYTES } from "@/lib/logoValidation"

export const MAX_LOGO_BYTES = 150 * 1024

async function fileToImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Unable to read image file."))
    reader.onload = () => resolve(String(reader.result || ""))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error("Unable to load image."))
    i.src = dataUrl
  })

  return img
}

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", quality))
  if (!blob) throw new Error("Unable to compress image.")
  return blob
}

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Unable to encode image."))
    reader.onload = () => resolve(String(reader.result || ""))
    reader.readAsDataURL(blob)
  })
}

export async function compressLogoToWebp(file: File) {
  const img = await fileToImage(file)

  const maxSide = 320
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
  const w = Math.max(1, Math.round((img.naturalWidth || 1) * scale))
  const h = Math.max(1, Math.round((img.naturalHeight || 1) * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Unable to prepare canvas.")
  ctx.drawImage(img, 0, 0, w, h)

  // Try a couple of qualities to get under 150KB.
  for (const q of [0.78, 0.7, 0.62, 0.54, 0.46]) {
    const blob = await canvasToWebpBlob(canvas, q)
    if (blob.size <= MAX_LOGO_BYTES) return blob
  }

  // Final fallback: accept the smallest one.
  return await canvasToWebpBlob(canvas, 0.4)
}

export async function uploadLogoToSupabase(file: File) {
  const userId = getActiveUserId()
  if (!userId) throw new Error("You must be signed in to upload a logo.")

  if (file.size > MAX_LOGO_UPLOAD_BYTES) {
    throw new Error("Logo file is too large. Please upload a smaller image.")
  }

  await validateLogoFile(file)

  const blob = await compressLogoToWebp(file)
  if (blob.size > MAX_LOGO_BYTES) {
    throw new Error("Logo is still above 150KB after compression. Try a simpler image.")
  }

  if (getAuthMode() === "local") {
    const publicUrl = await blobToDataUrl(blob)
    return { publicUrl, path: `${userId}/local-logo.webp`, size: blob.size }
  }

  const supabase = createSupabaseBrowserClient()
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  const path = buildLogoStoragePath(userId, Date.now(), suffix)

  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, blob, {
    upsert: false,
    contentType: "image/webp",
    cacheControl: "3600",
  })
  if (error) throw new Error(error.message)

  // Cheapest: use a public bucket and store public URL.
  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl, path, size: blob.size }
}

export async function deleteLogoFromSupabase(publicUrl: string | null | undefined) {
  const userId = getActiveUserId()
  if (!userId || !publicUrl) return
  if (getAuthMode() === "local") return

  const storagePath = getOwnedLogoStoragePath(publicUrl, userId)
  if (!storagePath) return

  const supabase = createSupabaseBrowserClient()
  await supabase.storage.from(LOGO_BUCKET).remove([storagePath]).catch(() => {})
}

