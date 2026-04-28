"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { setActiveOrGlobalItem } from "@/lib/userStore"

export default function SetupProfileBasicsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialBusinessName = searchParams.get("businessName") || ""
  const initialEmail = searchParams.get("email") || ""
  const initialDraft = useMemo(() => {
    const draft = getSetupProfileDraft()
    const resolvedBusinessName = draft.businessName || initialBusinessName
    const resolvedEmail = draft.email || initialEmail

    return {
      businessName: resolvedBusinessName,
      email: resolvedEmail,
      confirmEmail: resolvedEmail,
    }
  }, [initialBusinessName, initialEmail])

  const [businessName, setBusinessName] = useState(initialDraft.businessName)
  const [email, setEmail] = useState(initialDraft.email)
  const [confirmEmail, setConfirmEmail] = useState(initialDraft.confirmEmail)
  const [attemptedNext, setAttemptedNext] = useState(false)

  useEffect(() => {
    setActiveOrGlobalItem("setupResumePath", "/setup/profile")
  }, [])

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const businessNameError = !businessName.trim() ? "Business name is required." : ""
  const emailError = !email.trim() ? "Email is required." : !emailIsValid ? "Enter a valid email address." : ""
  const confirmEmailError = !confirmEmail.trim()
    ? "Please re-enter the same email."
    : confirmEmail.trim() !== email.trim()
      ? "Both email fields must match exactly."
      : ""

  const canContinue = !businessNameError && !emailError && !confirmEmailError
  const fieldClass = "app-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition"

  function showError(message: string, value: string) {
    return (attemptedNext || value.trim().length > 0) && message
  }

  function goNext() {
    setAttemptedNext(true)
    if (!canContinue) return

    const draft = getSetupProfileDraft()
    saveSetupProfileDraft({
      ...draft,
      businessName: businessName.trim(),
      email: email.trim(),
      emailLocked: false,
    })

    setActiveOrGlobalItem("setupResumePath", "/setup/profile/contact")
    router.push("/setup/profile/contact")
  }

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
              <p className="text-sm font-semibold text-slate-950">Step 1 - Business identity</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-xs font-semibold text-slate-600 sm:block">
              1<span className="text-slate-400">/</span>6
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-[rgba(83,93,105,0.14)]">
              <div className="h-full w-1/6 rounded-full bg-gradient-to-r from-[var(--accent-soft)] via-[var(--accent-strong)] to-[rgba(165,196,193,0.95)]" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-center lg:gap-7">
          <aside className="space-y-5 lg:flex lg:h-full lg:items-center">
            <div className="app-dark-card overflow-hidden rounded-[28px] p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/48">Business identity</p>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-3.5 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Preview</p>

                <div className="mt-3 rounded-[18px] border border-white/10 bg-black/10 p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Business name</p>
                  <p className="mt-2 line-clamp-2 text-[1.35rem] font-semibold leading-tight text-white">
                    {businessName.trim() ? businessName : "Your Business Name"}
                  </p>

                  <div className="mt-3 h-px bg-white/10" />

                  <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-white/42">Email</p>
                  <p className="mt-2 break-all text-[13px] font-semibold leading-6 text-white/88">
                    {email.trim() ? email : "you@business.com"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[30px] border border-[rgba(83,93,105,0.12)] bg-[rgba(255,252,247,0.97)] shadow-[0_24px_60px_rgba(73,45,21,0.08)]">
            <div className="border-b border-[rgba(83,93,105,0.1)] px-4 py-4 sm:px-7 sm:py-5">
              <p className="app-kicker text-[11px]">Business identity</p>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-700 sm:text-[1.05rem]">
                Add the business name and email clients should use.
              </p>
            </div>

            <div className="space-y-5 px-4 py-5 sm:px-7 sm:py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">Business name</label>
                <input
                  placeholder="e.g. ABC Traders"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={fieldClass}
                />
                {showError(businessNameError, businessName) ? (
                  <p className="mt-2 text-sm text-rose-600">{businessNameError}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">Email</label>
                  <input
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                  />
                  {showError(emailError, email) ? <p className="mt-2 text-sm text-rose-600">{emailError}</p> : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">Confirm email</label>
                  <input
                    placeholder="re-enter email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className={fieldClass}
                  />
                  {showError(confirmEmailError, confirmEmail) ? (
                    <p className="mt-2 text-sm text-rose-600">{confirmEmailError}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="app-sticky-bar flex flex-col gap-3 border-t border-[rgba(83,93,105,0.11)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
              <p className="text-sm text-slate-600">Next: contact details.</p>
              <button
                onClick={goNext}
                disabled={!canContinue}
                className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold transition sm:w-auto ${
                  canContinue ? "app-primary-button text-white" : "bg-slate-200 text-slate-500"
                }`}
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
