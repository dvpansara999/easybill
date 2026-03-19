import { Suspense } from "react"
import BusinessProfileClient from "./BusinessProfileClient"

export default function BusinessProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading business profile…
        </div>
      }
    >
      <BusinessProfileClient />
    </Suspense>
  )
}
