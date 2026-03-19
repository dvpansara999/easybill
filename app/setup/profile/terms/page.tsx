"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SetupWizardFrame from "@/components/setup/SetupWizardFrame"
import { emptySetupProfileDraft, getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { setActiveOrGlobalItem } from "@/lib/userStore"
import { ScrollText } from "lucide-react"

export default function SetupProfileTermsPage() {
  const router = useRouter()
  const [draft, setDraft] = useState(emptySetupProfileDraft)

  useEffect(() => {
    const storedDraft = getSetupProfileDraft()
    if (!storedDraft.businessName || !storedDraft.email) {
      router.push("/setup/profile")
      return
    }
    setDraft(storedDraft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/terms")
  }, [router])

  function goNext() {
    saveSetupProfileDraft(draft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/logo")
    router.push("/setup/profile/logo")
  }

  return (
    <SetupWizardFrame
      step={4}
      totalSteps={6}
      title="Add invoice terms (optional)."
      description="A short note reduces back-and-forth: payment timeline, return policy, or invoice instructions."
      bullets={[
        "Terms can be printed on invoices.",
        "One or two lines are usually enough.",
        "You can edit this anytime later.",
      ]}
      onBack={() => router.push("/setup/profile/bank")}
      aside={
        <div className="rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Suggestion</p>
          <p className="mt-3 text-sm text-white/70">
            Keep it friendly and specific. This text may appear under totals on printed invoices.
          </p>
          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Example</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Payment due within 7 days. Please include invoice number in the transfer note.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 px-7 py-6">
          <p className="text-sm font-semibold text-slate-900">Invoice terms</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">Optional, but useful for payment clarity.</p>
        </div>

        <div className="px-7 py-7">
          <textarea
            value={draft.terms}
            onChange={(e) => setDraft((prev) => ({ ...prev, terms: e.target.value }))}
            placeholder={`Examples:\n• Payment due within 7 days.\n• Goods once sold will not be taken back.`}
            className="min-h-[260px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          <div className="mt-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            Keep it professional, short, and consistent. You can always edit it later.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/setup/profile/bank")}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            Back
          </button>
          <button
            onClick={goNext}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      </div>
    </SetupWizardFrame>
  )
}
