"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CreditCard, Sparkles } from "lucide-react"
import { PLANS, canCreateAnotherInvoice, enforceFreeRestrictions, getActivePlanId, getInvoiceUsageCount, setActivePlanId, type PlanId } from "@/lib/plans"

export default function UpgradeClient() {
  const router = useRouter()
  const [active, setActive] = useState<PlanId>(() => getActivePlanId())
  const [message, setMessage] = useState("")

  const plans = useMemo(() => PLANS, [])
  const invoiceUsage = useMemo(() => getInvoiceUsageCount(), [active])
  const allowance = useMemo(() => canCreateAnotherInvoice(), [active])

  function choosePlan(id: PlanId) {
    setActive(id)
    setActivePlanId(id)
    if (id === "free") {
      enforceFreeRestrictions()
    }
    setMessage(id === "plus" ? "Plus plan activated." : "Switched to Free plan.")
    window.setTimeout(() => setMessage(""), 1800)
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Upgrade</p>
          <h1 className="font-display mt-3 text-4xl text-slate-950">Unlock more room to grow with easyBILL.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Start on Free, then upgrade when you’re ready. Your data stays connected to your account ID.
          </p>
        </div>

        <div className="soft-card rounded-[28px] p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Current Plan</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {active === "plus" ? "Plus" : "Free"}
          </p>
          {active === "free" ? (
            <p className="mt-2 text-sm text-slate-500">
              Invoices used: <span className="font-semibold text-slate-900">{invoiceUsage}</span>
              {allowance.remaining !== null ? (
                <>
                  {" "}
                  · Remaining: <span className="font-semibold text-slate-900">{allowance.remaining}</span>
                </>
              ) : null}
            </p>
          ) : null}
          {message ? <p className="mt-2 text-sm font-medium text-emerald-700">{message}</p> : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {plans.map((p) => {
          const selected = p.id === active
          return (
            <div
              key={p.id}
              className={`soft-card rounded-[28px] p-6 transition ${
                selected ? "ring-2 ring-emerald-300" : "hover:ring-2 hover:ring-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{p.name}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    {p.priceInr === 0 ? "₹0" : `₹${p.priceInr}`}
                    <span className="ml-2 text-sm font-medium text-slate-500">/month</span>
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {p.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {selected ? (
                  <button
                    disabled
                    className="w-full rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-500"
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    onClick={() => choosePlan(p.id)}
                    className="w-full rounded-2xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {p.id === "plus" ? "Upgrade to Plus" : "Switch to Free"}
                  </button>
                )}
              </div>

              {p.id === "plus" ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Payment isn’t wired yet — for now this simulates activation so we can enforce features across the app.
                </p>
              ) : null}
            </div>
          )
        })}
      </section>

      <div className="flex justify-end">
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

