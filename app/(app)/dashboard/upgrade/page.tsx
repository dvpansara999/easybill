import { Suspense } from "react"
import UpgradeClient from "./upgradeClient"

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="soft-card rounded-[28px] p-6 text-sm text-slate-500">
          Loading upgrade…
        </div>
      }
    >
      <UpgradeClient />
    </Suspense>
  )
}

