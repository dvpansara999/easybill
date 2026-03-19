"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SetupWizardFrame from "@/components/setup/SetupWizardFrame"
import { emptySetupProfileDraft, getSetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { setActiveOrGlobalItem } from "@/lib/userStore"
import { Phone, ReceiptText } from "lucide-react"

export default function SetupProfileContactPage() {
  const router = useRouter()
  const [draft, setDraft] = useState(emptySetupProfileDraft)

  useEffect(() => {
    const storedDraft = getSetupProfileDraft()
    if (!storedDraft.businessName || !storedDraft.email) {
      router.push("/setup/profile")
      return
    }
    setDraft(storedDraft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/contact")
  }, [router])

  function handleChange(field: string, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function goNext() {
    saveSetupProfileDraft(draft)
    setActiveOrGlobalItem("setupResumePath", "/setup/profile/bank")
    router.push("/setup/profile/bank")
  }

  return (
    <SetupWizardFrame
      step={2}
      totalSteps={6}
      title="Add contact details customers can rely on."
      description="These help your invoices feel complete and make it easier for clients to reach you."
      bullets={[
        "Phone and address can show directly on invoices.",
        "GST helps if your invoices need tax-ready details.",
        "You can update this later from Business Profile.",
      ]}
      onBack={() => router.push("/setup/profile")}
      aside={
        <>
          <div className="rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Used on invoices</p>
            <p className="mt-3 text-sm text-white/70">Clients use these details to contact you and verify your business.</p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Phone</p>
                    <p className="mt-1 text-sm font-semibold">{draft.phone || "Optional"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <ReceiptText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">GST</p>
                    <p className="mt-1 text-sm font-semibold">{draft.gst || "Optional"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      }
    >
      <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-200 px-7 py-6">
          <p className="text-sm font-semibold text-slate-900">Contact details</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            If you’re unsure about GST/address right now, you can leave them blank and finish setup.
          </p>
        </div>

        <div className="px-7 py-7 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">Phone</label>
              <input
                placeholder="e.g. +91 98765 43210"
                value={draft.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">GST number (optional)</label>
              <input
                placeholder="e.g. 24ABCDE1234F1Z5"
                value={draft.gst}
                onChange={(e) => handleChange("gst", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-900">Business address (optional)</label>
            <textarea
              placeholder="Street, area, city, state, pincode"
              value={draft.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="min-h-[170px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Tip: Keep it short—just enough for identification and compliance.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/setup/profile")}
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
