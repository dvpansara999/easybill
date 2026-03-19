import { Suspense } from "react"
import SettingsClient from "./SettingsClient"

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="soft-card rounded-[28px] p-6 text-sm text-slate-500">
          Loading settings…
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  )
}
