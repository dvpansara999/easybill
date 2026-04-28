"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Landmark, QrCode } from "lucide-react"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { setActiveOrGlobalItem } from "@/lib/userStore"

export default function SetupProfileBankPage() {
  const router = useRouter()
  const [draft, setDraft] = useState(() => getSetupProfileDraft())
  const isMissingBasics = !draft.businessName || !draft.email

  useEffect(() => {
    if (isMissingBasics) {
      router.push("/setup/profile")
    }
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/bank")
  }, [isMissingBasics, router])

  if (isMissingBasics) return null

  function handleChange(field: "bankName" | "accountNumber" | "ifsc" | "upi", value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function goNext() {
    saveSetupProfileDraft(draft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/terms")
    router.push("/setup/profile/terms")
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
              <p className="text-sm font-semibold text-slate-950">Step 3 - Payment details</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-xs font-semibold text-slate-600 sm:block">
              3<span className="text-slate-400">/</span>6
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-[rgba(83,93,105,0.14)]">
              <div className="h-full w-3/6 rounded-full bg-gradient-to-r from-[var(--accent-soft)] via-[var(--accent-strong)] to-[rgba(165,196,193,0.95)]" />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-center lg:gap-7">
          <aside className="space-y-5 lg:flex lg:h-full lg:items-center">
            <div className="app-dark-card overflow-hidden rounded-[28px] p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/48">Payment details</p>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-3.5 sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Preview</p>

                <div className="mt-3 grid gap-3 rounded-[18px] border border-white/10 bg-black/10 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                      <Landmark className="h-4 w-4 text-white/78" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Bank</p>
                      <p className="mt-1 truncate text-[13px] font-semibold leading-6 text-white/88">
                        {draft.bankName || "Optional"}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Account number</p>
                    <p className="mt-1 truncate text-[13px] font-semibold leading-6 text-white/88">
                      {draft.accountNumber || "Optional"}
                    </p>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">IFSC</p>
                    <p className="mt-1 truncate text-[13px] font-semibold leading-6 text-white/88">
                      {draft.ifsc || "Optional"}
                    </p>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
                      <QrCode className="h-4 w-4 text-white/78" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">UPI</p>
                      <p className="mt-1 truncate text-[13px] font-semibold leading-6 text-white/88">
                        {draft.upi || "Optional"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[30px] border border-[rgba(83,93,105,0.12)] bg-[rgba(255,252,247,0.97)] shadow-[0_24px_60px_rgba(73,45,21,0.08)]">
            <div className="border-b border-[rgba(83,93,105,0.1)] px-4 py-4 sm:px-7 sm:py-5">
              <p className="app-kicker text-[11px]">Payment details</p>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-700 sm:text-[1.05rem]">
                Add the bank or UPI details clients can pay through.
              </p>
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                ** all fields on this step are safe with encrypted data
              </p>
            </div>

            <div className="grid gap-4 px-4 py-5 sm:px-7 sm:py-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">Bank name</label>
                <input
                  placeholder="Optional"
                  value={draft.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  className="app-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">Account number</label>
                <input
                  placeholder="Optional"
                  value={draft.accountNumber}
                  onChange={(e) => handleChange("accountNumber", e.target.value)}
                  className="app-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">IFSC code</label>
                <input
                  placeholder="Optional"
                  value={draft.ifsc}
                  onChange={(e) => handleChange("ifsc", e.target.value)}
                  className="app-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">UPI ID</label>
                <input
                  placeholder="Optional"
                  value={draft.upi}
                  onChange={(e) => handleChange("upi", e.target.value)}
                  className="app-input w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition"
                />
              </div>
            </div>

            <div className="app-sticky-bar flex flex-col-reverse gap-3 border-t border-[rgba(83,93,105,0.11)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
              <button
                onClick={() => router.push("/setup/profile/contact")}
                className="app-secondary-button w-full rounded-2xl px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-auto"
              >
                Back
              </button>

              <p className="text-sm text-slate-600 sm:ml-auto sm:mr-4">Next: terms and notes.</p>

              <button
                onClick={goNext}
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
