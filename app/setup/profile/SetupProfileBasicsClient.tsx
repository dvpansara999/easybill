"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { setActiveOrGlobalItem } from "@/lib/userStore"
import { CheckCircle2, MailCheck } from "lucide-react"

export default function SetupProfileBasicsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialBusinessName = searchParams.get("businessName") || ""
  const initialEmail = searchParams.get("email") || ""

  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [email, setEmail] = useState(initialEmail)
  const [confirmEmail, setConfirmEmail] = useState(initialEmail)
  const [attemptedNext, setAttemptedNext] = useState(false)

  useEffect(() => {
    setActiveOrGlobalItem("setupResumePath", "/setup/profile")

    const loadDraft = () => {
      const draft = getSetupProfileDraft()
      setBusinessName(draft.businessName || initialBusinessName)
      setEmail(draft.email || initialEmail)
      setConfirmEmail(draft.email || initialEmail)
    }

    loadDraft()

    function onCloud() {
      loadDraft()
    }
    window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
    return () => window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
  }, [initialBusinessName, initialEmail])

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const businessNameError = !businessName.trim() ? "Business name is required." : ""
  const emailError = !email.trim() ? "Email is required." : !emailIsValid ? "Enter a valid email address." : ""
  const confirmEmailError = !confirmEmail.trim()
    ? "Please re-enter the same email."
    : confirmEmail.trim() !== email.trim()
      ? "Both email fields must match exactly."
      : ""

  const canContinue = !businessNameError && !emailError && !confirmEmailError

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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,_#fafaf9,_#f1f5f9)] px-4 py-8 lg:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(15,23,42,0.06)_1px,_transparent_1px),linear-gradient(to_bottom,_rgba(15,23,42,0.06)_1px,_transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
      <div className="absolute left-[-10%] top-[18%] h-80 w-80 rounded-full bg-amber-200/45 blur-3xl" />
      <div className="absolute right-[-12%] top-[6%] h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1120px]">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-sm">
              eB
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">easyBILL setup</p>
              <p className="text-sm font-semibold text-slate-950">Step 1 — Identity</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs font-semibold text-slate-600">
              1<span className="text-slate-400">/</span>6
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/6 rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500" />
            </div>
          </div>
        </div>

        <header className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h1 className="font-display text-3xl leading-[1.02] text-slate-950 sm:text-4xl lg:text-5xl">
              What should appear on your invoice header?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Add the business name and email you want printed on invoices. We’ll validate and confirm the email before saving.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">What happens next</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {[
                "Contact details (phone, GST, address)",
                "Payment details (bank/UPI)",
                "Terms, logo, and invoice defaults",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <>
            <aside className="order-2 space-y-6 lg:order-1 lg:sticky lg:top-8 lg:self-start hidden lg:block">
              <div className="rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-5 sm:p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Preview</p>
                <p className="mt-3 text-sm text-white/70">A quick mock of your invoice header.</p>

                <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-6">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Business name</p>
                  <p className="mt-2 line-clamp-2 text-3xl font-semibold leading-tight text-white">
                    {businessName.trim() ? businessName : "Your Business Name"}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-4 text-xs text-white/60">
                    <span>Invoice No</span>
                    <span className="font-semibold text-white/80">INV-0001</span>
                  </div>

                  <div className="mt-4 h-px bg-white/10" />

                  <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-white/55">Email</p>
                  <p className="mt-2 break-all text-sm font-semibold text-white">
                    {email.trim() ? email : "you@business.com"}
                  </p>
                </div>
              </div>

              <div className="rounded-[34px] border border-emerald-200 bg-emerald-50/80 p-5 sm:p-7 shadow-sm backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_26px_rgba(5,150,105,0.28)]">
                    <MailCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Email can be updated later</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                      You can edit this business email later from Business Profile. Keep both fields matching to continue.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile: collapse the preview */}
            <div className="order-2 lg:hidden">
              <details className="rounded-[28px] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                  Preview & guidance
                </summary>
                <div className="mt-3 space-y-6">
                  <div className="rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-5 sm:p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Preview</p>
                    <p className="mt-3 text-sm text-white/70">A quick mock of your invoice header.</p>

                    <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-4 sm:p-6">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Business name</p>
                      <p className="mt-2 line-clamp-2 text-3xl font-semibold leading-tight text-white">
                        {businessName.trim() ? businessName : "Your Business Name"}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-4 text-xs text-white/60">
                        <span>Invoice No</span>
                        <span className="font-semibold text-white/80">INV-0001</span>
                      </div>

                      <div className="mt-4 h-px bg-white/10" />

                      <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-white/55">Email</p>
                      <p className="mt-2 break-all text-sm font-semibold text-white">
                        {email.trim() ? email : "you@business.com"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[34px] border border-emerald-200 bg-emerald-50/80 p-5 sm:p-7 shadow-sm backdrop-blur">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_26px_rgba(5,150,105,0.28)]">
                        <MailCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">Email can be updated later</p>
                        <p className="mt-1 text-sm leading-6 text-emerald-800/80">
                          You can edit this business email later from Business Profile. Keep both fields matching to continue.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </>

          <section className="order-1 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)] lg:order-2">
            <div className="border-b border-slate-200 px-4 py-5 sm:px-7 sm:py-6">
              <p className="text-sm font-semibold text-slate-900">Your details</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                We’ll validate the email and ensure both fields match before continuing.
              </p>
            </div>

            <div className="px-4 py-6 sm:px-7 sm:py-7 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">Business name</label>
                <input
                  placeholder="e.g. ABC Traders"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
                {showError(businessNameError, businessName) && (
                  <p className="mt-2 text-sm text-rose-600">{businessNameError}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">Email</label>
                  <input
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  {showError(emailError, email) && (
                    <p className="mt-2 text-sm text-rose-600">{emailError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">Confirm email</label>
                  <input
                    placeholder="re-enter email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                  {showError(confirmEmailError, confirmEmail) && (
                    <p className="mt-2 text-sm text-rose-600">{confirmEmailError}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-5 sm:px-7 sm:py-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                You can update other profile details later.
              </p>
              <button
                onClick={goNext}
                disabled={!canContinue}
                className={`rounded-2xl px-6 py-3 text-sm font-semibold transition ${
                  canContinue
                    ? "bg-slate-950 text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] hover:bg-slate-800"
                    : "bg-slate-200 text-slate-500"
                } w-full sm:w-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100`}
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

