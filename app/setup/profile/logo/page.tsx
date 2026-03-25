"use client"

import "react-easy-crop/react-easy-crop.css"

import NextImage from "next/image"
import { type Area, type Point } from "react-easy-crop"
import Cropper from "react-easy-crop"
import { type ChangeEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SetupWizardFrame from "@/components/setup/SetupWizardFrame"
import { getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { deleteLogoFromSupabase, uploadLogoToSupabase, MAX_LOGO_BYTES } from "@/lib/logoUpload"
import { setActiveOrGlobalItem } from "@/lib/userStore"
import { Check, Circle, ImagePlus, Square } from "lucide-react"

const shapeOptions = [
  {
    value: "square" as const,
    label: "Square",
    description: "Best when you want a clean badge-style logo on invoices.",
    icon: Square,
  },
  {
    value: "round" as const,
    label: "Round",
    description: "Best for icons, stamps, and compact brand marks.",
    icon: Circle,
  },
]

function createImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", reject)
    image.src = src
  })
}

async function getCroppedLogo(imageSrc: string, pixelCrop: Area | null) {
  if (!imageSrc) return ""
  if (!pixelCrop) return imageSrc

  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    return imageSrc
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Keep the cropped image compact so we can safely store it if storage upload fails.
  return canvas.toDataURL("image/webp", 0.82)
}

export default function SetupProfileLogoPage() {
  const router = useRouter()
  const [draft, setDraft] = useState(() => getSetupProfileDraft())
  const [logoError, setLogoError] = useState("")
  const [crop, setCrop] = useState<Point>(() => ({
    x: ((getSetupProfileDraft().logoOffsetX || 50) - 50) * 4,
    y: ((getSetupProfileDraft().logoOffsetY || 50) - 50) * 4,
  }))
  const [zoom, setZoom] = useState(() => getSetupProfileDraft().logoZoom || 1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    if (!draft.businessName || !draft.email) {
      router.push("/setup/profile")
    }
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/logo")
  }, [draft.businessName, draft.email, router])

  function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError("")

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo must be 150KB or smaller. Please choose a smaller image.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const source = reader.result as string
      setDraft((prev) => ({
        ...prev,
        logoSource: source,
        logo: source,
        logoZoom: 1,
        logoOffsetX: 50,
        logoOffsetY: 50,
      }))
      setZoom(1)
      setCrop({ x: 0, y: 0 })
      setCroppedAreaPixels(null)
    }
    reader.readAsDataURL(file)
  }

  function deleteLogo() {
    setDraft((prev) => ({
      ...prev,
      logo: "",
      logoSource: "",
      logoZoom: 1,
      logoOffsetX: 50,
      logoOffsetY: 50,
    }))
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
  }

  function handleCropComplete(_: Area, croppedPixels: Area) {
    setCroppedAreaPixels(croppedPixels)
  }

  async function saveAndContinue() {
    const previousRemoteLogo = draft.logo.startsWith("http://") || draft.logo.startsWith("https://") ? draft.logo : ""
    const croppedLogo = draft.logoSource
      ? await getCroppedLogo(draft.logoSource, croppedAreaPixels)
      : ""

    // If user picked a logo, try uploading to Supabase Storage for cross-device access.
    // We store the final public URL in the business profile (cheap + portable).
    let uploadedUrl = ""
    if (draft.logoSource) {
      try {
        // Convert the cropped dataURL back to a Blob for upload.
        const res = await fetch(croppedLogo)
        const blob = await res.blob()
        const file = new File([blob], "logo.png", { type: blob.type || "image/png" })
        const { publicUrl } = await uploadLogoToSupabase(file)
        uploadedUrl = publicUrl
      } catch (e) {
        // Storage upload can fail if storage bucket policies aren't fully set.
        // Don't block setup; fall back to storing the cropped logo locally for now.
        setLogoError(e instanceof Error ? e.message : "Unable to upload logo. Using local logo instead.")
      }
    }

    if (!uploadedUrl && !croppedLogo && previousRemoteLogo) {
      await deleteLogoFromSupabase(previousRemoteLogo)
    }

    if (uploadedUrl && previousRemoteLogo && previousRemoteLogo !== uploadedUrl) {
      await deleteLogoFromSupabase(previousRemoteLogo)
    }

    const nextDraft = {
      ...draft,
      logo: uploadedUrl || croppedLogo,
      logoZoom: zoom,
      logoOffsetX: Math.round(crop.x / 4 + 50),
      logoOffsetY: Math.round(crop.y / 4 + 50),
    }

    saveSetupProfileDraft(nextDraft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/settings")
    router.push("/setup/profile/settings")
  }

  const previewSource = draft.logo || draft.logoSource

  return (
    <SetupWizardFrame
      step={5}
      totalSteps={6}
      title="Add your logo (optional)."
      description="Upload a logo, crop it visually, and pick the shape that matches your brand."
      bullets={[
        "Upload a PNG or JPG.",
        "Drag to choose the visible cut.",
        "You can skip this and add later.",
      ]}
      onBack={() => router.push("/setup/profile/terms")}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-4 py-5 sm:px-7 sm:py-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">Upload + crop</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Pick a logo and crop it for the invoice header.</p>
            </div>

            <div className="flex items-center gap-3">
              {draft.logoSource && (
                <button
                  onClick={deleteLogo}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                >
                  Remove
                </button>
              )}
              <label
                tabIndex={0}
                className="cursor-pointer rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {draft.logoSource ? "Replace Logo" : "Upload Logo"}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-7 sm:py-7 space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/10 ${
                      draft.logoShape === "round" ? "rounded-full" : "rounded-2xl"
                    }`}
                  >
                    {previewSource ? (
                      <NextImage src={previewSource} alt="" fill unoptimized className="object-cover" />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-white/60" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">Preview</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {previewSource ? "Ready for invoices." : "Upload a logo to preview."}
                    </p>
                    <p className="mt-1 text-sm text-white/70">Cropped result will be used across templates.</p>
                  </div>
                </div>
                <div className="hidden sm:block rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                  Shape: <span className="font-semibold capitalize text-white">{draft.logoShape}</span>
                </div>
              </div>
            </div>

            {draft.logoSource ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div className="relative h-[300px] overflow-hidden rounded-[22px] bg-white">
                  <Cropper
                    image={draft.logoSource}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape={draft.logoShape === "round" ? "round" : "rect"}
                    showGrid
                    onCropChange={setCrop}
                    onCropComplete={handleCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">Zoom</span>
                    <span className="text-slate-500">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <p className="text-sm font-semibold text-slate-900">No logo uploaded</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Upload a PNG or JPG to open the crop area.</p>
              </div>
            )}

            {logoError ? (
              <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {logoError}
              </div>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-7 sm:py-6">
            <p className="text-sm font-semibold text-slate-900">Shape + guidance</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Choose how your logo is clipped on invoices.</p>
          </div>

          <div className="px-4 py-6 sm:px-7 sm:py-7 space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Tip</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Square works best for wordmarks. Round works best for icons and stamps.
              </p>
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                Current: <span className="font-semibold capitalize text-slate-900">{draft.logoShape}</span>
              </div>
            </div>

            <div className="grid gap-3">
              {shapeOptions.map((option) => {
                const Icon = option.icon
                const active = draft.logoShape === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, logoShape: option.value }))}
                    className={`w-full rounded-[24px] border p-5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      active
                        ? "border-indigo-300 bg-indigo-50/70 shadow-[0_12px_28px_rgba(99,102,241,0.10)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 items-center justify-center ${
                            option.value === "round" ? "rounded-full" : "rounded-2xl"
                          } ${active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-950">{option.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                        </div>
                      </div>
                      {active && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-7 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => router.push("/setup/profile/terms")}
              className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
            >
              Back
            </button>
            <button
              onClick={saveAndContinue}
              className="w-full sm:w-auto rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
            >
              Save and continue
            </button>
          </div>
        </section>
      </div>
    </SetupWizardFrame>
  )
}
