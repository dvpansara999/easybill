"use client"

import "react-easy-crop/react-easy-crop.css"

import NextImage from "next/image"
import { type Area, type Point } from "react-easy-crop"
import Cropper from "react-easy-crop"
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useBusiness } from "@/context/BusinessContext"
import { Building2, Check, Circle, Landmark, ScrollText, Square, Upload } from "lucide-react"
import { flushCloudKeyNow, getActiveOrGlobalItem } from "@/lib/userStore"
import { useAppAlert } from "@/components/providers/AppAlertProvider"
import { deleteLogoFromSupabase, uploadLogoToSupabase } from "@/lib/logoUpload"
import { useUnsavedChangesGuard } from "@/lib/unsavedChangesGuard"
import { getLogoUploadRuleText, validateLogoFile } from "@/lib/logoValidation"
import { EMPTY_BUSINESS_PROFILE, normalizeBusinessProfile, type BusinessProfileRecord } from "@/lib/businessProfile"

type BusinessProfile = BusinessProfileRecord

const emptyProfile: BusinessProfile = EMPTY_BUSINESS_PROFILE

function readProfileFromStore(): BusinessProfile {
  if (typeof window === "undefined") return emptyProfile

  const saved = getActiveOrGlobalItem("businessProfile")
  if (!saved) return emptyProfile

  try {
    return normalizeBusinessProfile(JSON.parse(saved))
  } catch {
    return emptyProfile
  }
}

export default function BusinessProfileClient() {
  const { setBusiness } = useBusiness()
  const router = useRouter()
  const searchParams = useSearchParams()
  const setupMode = searchParams.get("setup") === "1"
  const { showAlert } = useAppAlert()

  const [profile, setProfile] = useState<BusinessProfile>(() => readProfileFromStore())
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState<BusinessProfile>(() => readProfileFromStore())
  const [logoSource, setLogoSource] = useState("")
  const [logoCrop, setLogoCrop] = useState<Point>({ x: 0, y: 0 })
  const [logoZoom, setLogoZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

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

  useEffect(() => {
    router.prefetch("/dashboard/settings")
    router.prefetch("/dashboard/invoices/create")
  }, [router])

  useEffect(() => {
    function refreshProfile() {
      const nextProfile = readProfileFromStore()
      setSavedProfileSnapshot(nextProfile)
      setProfile(nextProfile)
    }

    function onKvWrite(e: Event) {
      const key = (e as CustomEvent<{ key?: string }>).detail?.key
      if (key === "businessProfile") {
        refreshProfile()
      }
    }

    function onStorage(e: StorageEvent) {
      if (!e.key) return
      if (e.key.startsWith("businessProfile::") || e.key === "businessProfile") {
        refreshProfile()
      }
    }

    window.addEventListener("easybill:cloud-sync", refreshProfile as EventListener)
    window.addEventListener("easybill:kv-write", onKvWrite as EventListener)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("easybill:cloud-sync", refreshProfile as EventListener)
      window.removeEventListener("easybill:kv-write", onKvWrite as EventListener)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const handleChange = (field: keyof BusinessProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const hasUnsavedChanges = useMemo(() => {
    return logoSource !== "" || JSON.stringify(profile) !== JSON.stringify(savedProfileSnapshot)
  }, [logoSource, profile, savedProfileSnapshot])

  const revertChanges = useCallback(() => {
    setProfile(savedProfileSnapshot)
    setLogoSource("")
    setLogoZoom(1)
    setLogoCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
    setSaveMessage("")
  }, [savedProfileSnapshot])

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    void validateLogoFile(file)
      .then(() => {
        reader.onload = () => {
          const source = String(reader.result || "")
          if (!source) return
          setLogoSource(source)
          setLogoZoom(1)
          setLogoCrop({ x: 0, y: 0 })
          setCroppedAreaPixels(null)
          // Preview while editing before cloud upload on save.
          setProfile((prev) => ({ ...prev, logo: source }))
        }
        reader.readAsDataURL(file)
      })
      .catch((error) => {
        showAlert({
          tone: "warning",
          title: "Logo not accepted",
          actionHint: "Use a valid logo file, then upload again.",
          message: error instanceof Error ? error.message : "Unable to use this logo file.",
        })
      })
  }

  const deleteLogo = () => {
    setProfile((prev) => ({
      ...prev,
      logo: "",
    }))
    setLogoSource("")
    setLogoZoom(1)
    setLogoCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
  }

  function handleCropComplete(_: Area, croppedPixels: Area) {
    setCroppedAreaPixels(croppedPixels)
  }

  const saveProfile = async (options?: { navigateAfterSave?: boolean }) => {
    setSavingProfile(true)
    setSaveMessage("")
    let nextProfile = { ...profile }
    const previousRemoteLogoPath = profile.logoStoragePath || ""
    let uploadedRemoteLogoPath = ""

    if (logoSource) {
      try {
        const croppedLogo = await getCroppedLogo(logoSource, croppedAreaPixels)
        const res = await fetch(croppedLogo)
        const blob = await res.blob()
        const file = new File([blob], "logo.webp", { type: blob.type || "image/webp" })
        const { publicUrl, path } = await uploadLogoToSupabase(file)
        uploadedRemoteLogoPath = path
        nextProfile = { ...nextProfile, logo: publicUrl, logoStoragePath: path }
      } catch (err) {
        setSavingProfile(false)
        showAlert({
          tone: "danger",
          title: "Logo upload failed",
          actionHint: "Check your connection and file format, then try uploading again.",
          message: err instanceof Error ? err.message : "Unable to upload logo.",
        })
        return false
      }
    }

    if (!nextProfile.logo && previousRemoteLogoPath) {
      await deleteLogoFromSupabase(previousRemoteLogoPath)
    }

    if (uploadedRemoteLogoPath && previousRemoteLogoPath && previousRemoteLogoPath !== uploadedRemoteLogoPath) {
      await deleteLogoFromSupabase(previousRemoteLogoPath)
    }

    if (!nextProfile.logo) {
      nextProfile = { ...nextProfile, logoStoragePath: "" }
    }

    // Persist via context so `terms` and all fields stay in sync (setBusiness normalizes + writes KV).
    setBusiness(nextProfile)
    await flushCloudKeyNow("businessProfile").catch(() => {})
    setSavedProfileSnapshot(nextProfile)
    setProfile(nextProfile)
    setLogoSource("")
    setSavingProfile(false)

    if (setupMode && options?.navigateAfterSave !== false) {
      setSaveMessage("Profile saved. Opening settings...")
      router.push("/dashboard/settings?setup=1")
      return true
    }

    setSaveMessage("Profile saved and applied across invoices, templates, and exports.")
    window.setTimeout(() => setSaveMessage(""), 2500)

    showAlert({
      tone: "success",
      title: "Business profile saved",
      actionHint: "You can keep editing or continue invoicing - changes apply everywhere.",
      message: "Your business details are saved and will be used across templates, print, and PDF exports.",
    })
    return true
  }

  useUnsavedChangesGuard({
    hasUnsavedChanges,
    onApply: () => saveProfile({ navigateAfterSave: false }),
    onRevert: revertChanges,
    actionHint: "Apply your business profile before leaving, or revert the changes and continue.",
    message: "You changed business details on this page.",
  })

  return (
    <div className="space-y-6 pb-28 lg:space-y-8 lg:pb-0">
      {setupMode && (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5 lg:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Setup Step 1</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Start by saving your business profile. Once this is done, we’ll take you to settings so you can finalize invoice behavior like numbering, currency, and decimals.
          </p>
          <p className="mt-2 text-xs leading-6 text-emerald-800">
            Sensitive profile fields, including bank details, are stored with encrypted handling so your business data stays protected.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Business Profile</p>
          <h1 className="font-display mt-3 text-3xl text-slate-950 sm:text-4xl lg:text-4xl">
            Shape the identity that appears across your invoices.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            easyBILL will use the information below only for generating your invoices.
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            Sensitive data including bank details, are end-to-end encrypted.
          </p>
        </div>
      </section>

      {saveMessage ? (
        <div className="eb-fade-slide-in rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="soft-card rounded-[24px] p-4 sm:p-6 lg:rounded-[28px] lg:p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Brand Mark</p>

          <div className="mt-5 space-y-4">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Upload + crop</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {(profile.logo || logoSource) && (
                  <button
                    type="button"
                    onClick={deleteLogo}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Remove
                  </button>
                )}
                <label className="w-full cursor-pointer rounded-2xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto">
                  {profile.logo ? "Replace Logo" : "Upload Logo"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {logoSource ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <div className="relative h-[220px] overflow-hidden rounded-[22px] bg-white sm:h-[300px]">
                  <Cropper
                    image={logoSource}
                    crop={logoCrop}
                    zoom={logoZoom}
                    aspect={1}
                    cropShape={profile.logoShape === "round" ? "round" : "rect"}
                    showGrid
                    onCropChange={setLogoCrop}
                    onCropComplete={handleCropComplete}
                    onZoomChange={setLogoZoom}
                  />
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900">Zoom</span>
                    <span className="text-slate-500">{logoZoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={logoZoom}
                    onChange={(e) => setLogoZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : profile.logo ? (
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div
                  className={`mx-auto flex h-40 w-full max-w-[320px] items-center justify-center overflow-hidden border border-slate-200 bg-white sm:h-48 ${
                    profile.logoShape === "round" ? "rounded-full" : "rounded-[22px]"
                  }`}
                >
                  <div className="relative h-full w-full">
                    <NextImage src={profile.logo} alt="" fill unoptimized className="object-cover" />
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 text-center sm:min-h-[260px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-5 text-lg font-semibold text-slate-900">Upload Your Logo</p>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  Add a clean brand mark that can be used across your invoice templates.
                </p>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "square" as const, label: "Square", icon: Square },
                { value: "round" as const, label: "Round", icon: Circle },
              ].map((shape) => {
                const Icon = shape.icon
                const active = profile.logoShape === shape.value
                return (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() => setProfile((prev) => ({ ...prev, logoShape: shape.value }))}
                    className={`w-full rounded-[24px] border px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? "border-indigo-300 bg-indigo-50/70 text-indigo-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {shape.label}
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Logo rule:</span> {getLogoUploadRuleText()}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6 lg:rounded-[28px] lg:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title text-2xl">Business Details</h2>
                <p className="text-sm text-slate-500">Primary information shown on invoices and exports.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 sm:gap-4">
              <input
                placeholder="Business Name"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
              />
              <input
                placeholder="Phone"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <input
                placeholder="GST Number"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.gst}
                onChange={(e) => handleChange("gst", e.target.value)}
              />
            </div>

            <div className="mt-4">
              <input
                placeholder="Email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <textarea
              placeholder="Business Address"
              className="mt-4 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={profile.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6 lg:rounded-[28px] lg:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title text-2xl">Bank Details</h2>
                <p className="text-sm text-slate-500">
                  Payment details available inside invoice templates. Bank fields are protected with encrypted storage handling.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 sm:gap-4">
              <input
                placeholder="Bank Name"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
              />
              <input
                placeholder="Account Number"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.accountNumber}
                onChange={(e) => handleChange("accountNumber", e.target.value)}
              />
              <input
                placeholder="IFSC Code"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.ifsc}
                onChange={(e) => handleChange("ifsc", e.target.value)}
              />
              <input
                placeholder="UPI ID"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                value={profile.upi}
                onChange={(e) => handleChange("upi", e.target.value)}
              />
            </div>
          </div>

          <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6 lg:rounded-[28px] lg:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="section-title text-2xl">Invoice Terms</h2>
                <p className="text-sm text-slate-500">Keep payment rules and disclaimers ready for invoice use.</p>
              </div>
            </div>

            <textarea
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              value={profile.terms}
              onChange={(e) => handleChange("terms", e.target.value)}
            />
          </div>
        </section>
      </div>

        <button
          onClick={() => void saveProfile()}
          disabled={savingProfile}
          className={`hidden lg:inline-flex items-center rounded-2xl px-6 py-3 text-sm font-semibold text-white transition ${
            savingProfile ? "cursor-not-allowed bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
        }`}
      >
        {savingProfile ? "Saving..." : setupMode ? "Save And Continue" : "Save Business Profile"}
      </button>

      {/* Mobile sticky save */}
      <div className="eb-safe-bottom-pad fixed inset-x-0 bottom-0 z-40 bg-white/95 px-4 pt-3 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden">
        <button
          onClick={() => void saveProfile()}
          disabled={savingProfile}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition ${
            savingProfile ? "cursor-not-allowed bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
          }`}
        >
          {savingProfile ? "Saving..." : setupMode ? "Save And Continue" : "Save Business Profile"}
        </button>
      </div>
    </div>
  )
}

