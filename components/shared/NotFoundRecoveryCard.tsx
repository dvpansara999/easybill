"use client"

type NotFoundRecoveryCardProps = {
  title: string
  description: string
  onBack: () => void
  onDashboard: () => void
  onRetry: () => void
  backLabel?: string
}

export default function NotFoundRecoveryCard({
  title,
  description,
  onBack,
  onDashboard,
  onRetry,
  backLabel = "Back",
}: NotFoundRecoveryCardProps) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-[0_18px_42px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Recovery</p>
      <h2 className="font-display mt-3 text-2xl text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onDashboard}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to dashboard
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Retry sync
        </button>
      </div>
    </div>
  )
}
