"use client"

import "react-easy-crop/react-easy-crop.css"

import NextImage from "next/image"
import { type ChangeEvent, useEffect, useState } from "react"
import Cropper, { type Area, type Point } from "react-easy-crop"
import { useRouter } from "next/navigation"
import { Check, Circle, ImagePlus, Square } from "lucide-react"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { deleteLogoFromSupabase, uploadLogoToSupabase } from "@/lib/logoUpload"
import { getLogoUploadRuleText, validateLogoFile } from "@/lib/logoValidation"
import { setActiveOrGlobalItem } from "@/lib/userStore"

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

  if (!context) return imageSrc

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
    const reader = new FileReader()

    void validateLogoFile(file)
      .then(() => {
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
      })
      .catch((error) => {
        setLogoError(error instanceof Error ? error.message : "Unable to use this logo file.")
      })
  }

  function deleteLogo() {
    setDraft((prev) => ({
      ...prev,
      logo: "",
      logoSource: "",
      logoStoragePath: "",
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
    const previousRemoteLogo =
      draft.logoStoragePath || (draft.logo.startsWith("http://") || draft.logo.startsWith("https://") ? draft.logo : "")
    const croppedLogo = draft.logoSource ? await getCroppedLogo(draft.logoSource, croppedAreaPixels) : ""

    let uploadedUrl = ""
    let uploadedPath = ""

    if (draft.logoSource) {
      try {
        const res = await fetch(croppedLogo)
        const blob = await res.blob()
        const file = new File([blob], "logo.png", { type: blob.type || "image/png" })
        const { publicUrl, path } = await uploadLogoToSupabase(file)
        uploadedUrl = publicUrl
        uploadedPath = path
      } catch (error) {
        setLogoError(error instanceof Error ? error.message : "Unable to upload logo. Using local logo instead.")
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
      logoStoragePath: uploadedPath || "",
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
    <main className="app-shell relative min-h-screen overflow-hidden px-4 py-8 lg:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:88px_88px] [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_78%)]" />
      <div className="absolute left-[-12%] top-[14%] h-72 w-72 rounded-full bg-[rgba(208,174,138,0.14)] blur-3xl" />
      <div className="absolute right-[-12%] top-[4%] h-64 w-64 rounded-full bg-[rgba(165,196,193,0.12)] blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1080px]">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <EasyBillLogoMark size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">easyBILL setup</p>
              <p className="text-sm font-semibold text-slate-950">Step 5 - Logo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-xs font-semibold text-slate-600 sm:block">
              5<span className="text-slate-400">/</span>6
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-[rgba(83,93,105,0.14)]">
              <div className="h-full w-5/6 rounded-full bg-gradient-to-r from-[var(--accent-soft)] via-[var(--accent-strong)] to-[rgba(165,196,193,0.95)]" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-center lg:gap-7">
          <aside className="space-y-5 lg:flex lg:h-full lg:items-center">
            <div className="app-dark-card overflow-hidden rounded-[28px] p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/48">Logo</p>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-3.5 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Preview</p>

                <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-white/10 bg-black/10 p-4">
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

                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Shape</p>
                    <p className="mt-1 text-[13px] font-semibold leading-6 text-white/88 capitalize">
                      {previewSource ? `${draft.logoShape} logo` : "No logo yet"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[30px] border border-[rgba(83,93,105,0.12)] bg-[rgba(255,252,247,0.97)] shadow-[0_24px_60px_rgba(73,45,21,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[rgba(83,93,105,0.11)] px-4 py-4 sm:px-7 sm:py-5">
                <div>
                  <p className="app-kicker text-[11px]">Logo</p>
                  <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-700 sm:text-[1.05rem]">
                    Upload your logo and choose the crop clients should see.
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">{getLogoUploadRuleText()}</p>
                </div>

                {draft.logoSource ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={deleteLogo}
                      className="app-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
                    >
                      Remove
                    </button>

                    <label className="app-primary-button cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-white">
                      Replace Logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                ) : null}
              </div>

            <div className="space-y-5 px-4 py-5 sm:px-7 sm:py-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_300px] xl:items-start">
                {draft.logoSource ? (
                  <div className="rounded-[24px] border border-[rgba(83,93,105,0.11)] bg-white p-4">
                    <div className="relative h-[220px] overflow-hidden rounded-[22px] bg-white sm:h-[250px]">
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
                      <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                    </div>
                  </div>
                ) : (
                  <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-[rgba(83,93,105,0.18)] bg-white px-5 py-8 text-center transition hover:border-[rgba(29,107,95,0.25)] hover:bg-[rgba(250,248,243,0.9)] sm:py-9">
                    <p className="text-sm font-semibold text-slate-900">Upload logo here</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">PNG or JPG. Click to choose a file.</p>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}

                <div className="rounded-[24px] border border-[rgba(83,93,105,0.11)] bg-[rgba(250,248,243,0.9)] p-4 sm:p-5">
                  <p className="app-kicker text-[11px]">Shape</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Pick the clipping style that feels most natural for your brand.</p>

                  <div className="mt-4 grid gap-3">
                    {shapeOptions.map((option) => {
                      const Icon = option.icon
                      const active = draft.logoShape === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDraft((prev) => ({ ...prev, logoShape: option.value }))}
                          className={`w-full rounded-[22px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(29,107,95,0.12)] ${
                            active
                              ? "border-[rgba(29,107,95,0.2)] bg-[rgba(18,111,84,0.08)] shadow-[0_12px_28px_rgba(18,111,84,0.10)]"
                              : "bg-white hover:border-[rgba(83,93,105,0.2)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center ${
                                  option.value === "round" ? "rounded-full" : "rounded-2xl"
                                } ${active ? "bg-[rgba(18,111,84,0.12)] text-[var(--accent-strong)]" : "bg-[rgba(83,93,105,0.1)] text-slate-600"}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              <div>
                                <p className="pt-1 text-[15px] font-semibold text-slate-950">{option.label}</p>
                              </div>
                            </div>

                            {active ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-strong)] text-white">
                                <Check className="h-4 w-4" />
                              </div>
                            ) : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {logoError ? (
                <div className="rounded-[22px] border border-[rgba(186,52,86,0.18)] bg-[rgba(186,52,86,0.08)] px-4 py-3 text-sm text-[rgb(123,31,52)]">
                  {logoError}
                </div>
              ) : null}
            </div>

            <div className="app-sticky-bar flex flex-col-reverse gap-3 border-t border-[rgba(83,93,105,0.11)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
              <button
                onClick={() => router.push("/setup/profile/terms")}
                className="app-secondary-button w-full rounded-2xl px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-auto"
              >
                Back
              </button>
              <p className="text-sm text-slate-600 sm:ml-auto sm:mr-4">Next: invoice defaults.</p>
              <button
                onClick={saveAndContinue}
                className="app-primary-button w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white sm:w-auto"
              >
                Continue
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
