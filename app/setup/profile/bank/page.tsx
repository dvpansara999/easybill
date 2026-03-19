"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SetupWizardFrame from "@/components/setup/SetupWizardFrame"
import { emptySetupProfileDraft, getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { setActiveOrGlobalItem } from "@/lib/userStore"
import { Landmark, QrCode } from "lucide-react"

export default function SetupProfileBankPage() {
  const router = useRouter()
  const [draft, setDraft] = useState(emptySetupProfileDraft)

  useEffect(() => {
    const storedDraft = getSetupProfileDraft()
    if (!storedDraft.businessName || !storedDraft.email) {
      router.push("/setup/profile")
      return
    }
    setDraft(storedDraft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/bank")
  }, [router])

  function handleChange(field: string, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function goNext() {
    saveSetupProfileDraft(draft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/terms")
    router.push("/setup/profile/terms")
  }

  return (
    <SetupWizardFrame
      step={3}
      totalSteps={6}
      title="Add payment details (optional)."
      description="If you usually include bank/UPI info on invoices, add it now to save time later."
      bullets={[
        "Bank details can appear in invoice templates.",
        "UPI helps with quick payments.",
        "You can change this later from Business Profile.",
      ]}
      onBack={() => router.push("/setup/profile/contact")}
      aside={
        <div className="rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Optional</p>
          <p className="mt-3 text-sm text-white/70">If you don’t share payment details on invoices, you can keep this empty.</p>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Bank</p>
                  <p className="mt-1 text-sm font-semibold">{draft.bankName || "Not set"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">UPI</p>
                  <p className="mt-1 text-sm font-semibold">{draft.upi || "Not set"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 px-7 py-6">
          <p className="text-sm font-semibold text-slate-900">Payment details</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">These can appear on your invoice templates.</p>
        </div>

        <div className="grid gap-4 px-7 py-7 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">Bank name</label>
            <input
              placeholder="e.g. HDFC Bank"
              value={draft.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">Account number</label>
            <input
              placeholder="e.g. 1234 5678 9012"
              value={draft.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">IFSC code</label>
            <input
              placeholder="e.g. HDFC0001234"
              value={draft.ifsc}
              onChange={(e) => handleChange("ifsc", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">UPI ID</label>
            <input
              placeholder="e.g. abc@upi"
              value={draft.upi}
              onChange={(e) => handleChange("upi", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/setup/profile/contact")}
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
