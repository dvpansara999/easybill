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
    <div className="app-hero-panel p-6 text-center sm:p-8">
      <p className="app-kicker">Recovery</p>
      <h2 className="app-page-title mt-3 text-2xl sm:text-3xl">{title}</h2>
      <p className="app-page-copy mt-3 text-sm sm:text-base">{description}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={onBack}
          className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onDashboard}
          className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          Back to dashboard
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="app-primary-button rounded-2xl px-4 py-3 text-sm font-semibold text-white"
        >
          Retry sync
        </button>
      </div>
    </div>
  )
}
