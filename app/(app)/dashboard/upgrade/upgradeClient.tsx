"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CreditCard, Sparkles } from "lucide-react"
import {
  PLANS,
  canCreateAnotherInvoice,
  enforceFreeRestrictions,
  getActivePlanId,
  getInvoiceUsageCount,
  setActivePlanId,
  type PlanId,
} from "@/lib/plans"

export default function UpgradeClient() {
  const router = useRouter()
  const [active, setActive] = useState<PlanId>(() => getActivePlanId())
  const [message, setMessage] = useState("")

  const plans = useMemo(() => PLANS, [])
  const invoiceUsage = useMemo(() => getInvoiceUsageCount(), [])
  const allowance = useMemo(() => canCreateAnotherInvoice(), [])

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
    <div className="min-w-0 space-y-6 pb-24 lg:space-y-8 lg:pb-0">
      <section className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,min(360px,40vw))]">
        <div className="min-w-0">
          <p className="app-kicker">Upgrade</p>
          <h1 className="app-page-title mt-3 text-3xl sm:text-4xl">Unlock more room to grow with easyBILL.</h1>
          <p className="app-page-copy mt-3 max-w-2xl text-sm">
            Start on Free, then upgrade when you are ready. Your data stays connected to your account ID.
          </p>
        </div>

        <div className="app-stat-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-500">Current Plan</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{active === "plus" ? "Plus" : "Free"}</p>
          {active === "free" ? (
            <p className="mt-2 text-sm text-slate-500">
              Invoices used: <span className="font-semibold text-slate-900">{invoiceUsage}</span>
              {allowance.remaining !== null ? (
                <>
                  {" "}
                  Remaining: <span className="font-semibold text-slate-900">{allowance.remaining}</span>
                </>
              ) : null}
            </p>
          ) : null}
          {message ? <p className="mt-2 text-sm font-medium text-emerald-700">{message}</p> : null}
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {plans.map((plan) => {
          const selected = plan.id === active
          return (
            <div
              key={plan.id}
              className={`soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6 transition ${
                selected ? "ring-2 ring-emerald-300" : "hover:ring-2 hover:ring-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{plan.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                    {plan.priceInr === 0 ? "₹ 0" : `₹ ${plan.priceInr}`}
                    <span className="ml-2 text-sm font-medium text-slate-500">/month</span>
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {selected ? (
                  <button disabled className="w-full rounded-2xl bg-slate-200 py-3 text-sm font-semibold text-slate-500">
                    Current plan
                  </button>
                ) : (
                  <button
                    onClick={() => choosePlan(plan.id)}
                    className="app-primary-button w-full rounded-2xl py-3 text-sm font-semibold text-white transition"
                  >
                    {plan.id === "plus" ? "Upgrade to Plus" : "Switch to Free"}
                  </button>
                )}
              </div>

              {plan.id === "plus" ? (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Payment is not wired yet. For now this simulates activation so we can enforce plan features across the app.
                </p>
              ) : null}
            </div>
          )
        })}
      </section>

      <div className="flex justify-center sm:justify-end">
        <button
          onClick={() => router.push("/dashboard")}
          className="app-secondary-button w-full rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white sm:w-auto"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
