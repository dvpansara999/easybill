import { Suspense } from "react"
import SetupProfileBasicsClient from "./SetupProfileBasicsClient"

export default function SetupProfileBasicsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading setup…
        </div>
      }
    >
      <SetupProfileBasicsClient />
    </Suspense>
  )
}
