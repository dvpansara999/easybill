"use client"

export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const
export const MAX_LOGO_UPLOAD_BYTES = 5 * 1024 * 1024
export const MIN_LOGO_DIMENSION = 48
export const MAX_LOGO_DIMENSION = 4096

export type LogoValidationResult = {
  width: number
  height: number
  type: string
  size: number
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Unable to read image file."))
    reader.onload = () => resolve(String(reader.result || ""))
    reader.readAsDataURL(file)
  })
}

function readImageSize(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 })
    image.onerror = () => reject(new Error("Unable to load image."))
    image.src = src
  })
}

export async function validateLogoFile(file: File): Promise<LogoValidationResult> {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type as (typeof ACCEPTED_LOGO_TYPES)[number])) {
    throw new Error("Upload a PNG, JPG, or WebP logo.")
  }

  if (file.size > MAX_LOGO_UPLOAD_BYTES) {
    throw new Error("Logo file is too large. Please keep it under 5MB before compression.")
  }

  const src = await readFileAsDataUrl(file)
  const { width, height } = await readImageSize(src)

  if (width < MIN_LOGO_DIMENSION || height < MIN_LOGO_DIMENSION) {
    throw new Error(`Logo is too small. Use at least ${MIN_LOGO_DIMENSION} x ${MIN_LOGO_DIMENSION} pixels.`)
  }

  if (width > MAX_LOGO_DIMENSION || height > MAX_LOGO_DIMENSION) {
    throw new Error(`Logo is too large. Keep it under ${MAX_LOGO_DIMENSION} x ${MAX_LOGO_DIMENSION} pixels.`)
  }

  return {
    width,
    height,
    type: file.type,
    size: file.size,
  }
}

export function getLogoUploadRuleText() {
  return "Use PNG, JPG, or WebP. Keep logos at least 48x48px, under 5MB before upload, and under 150KB after compression."
}
