import { Suspense } from "react"
import SetupProfileBasicsClient from "./SetupProfileBasicsClient"

export default function SetupProfileBasicsPage() {
  return (
    <Suspense
      fallback={
        <div className="app-hero-panel p-6 text-sm text-slate-500">
          Loading setup...
        </div>
      }
    >
      <SetupProfileBasicsClient />
    </Suspense>
  )
}
