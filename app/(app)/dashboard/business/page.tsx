import { Suspense } from "react"
import BusinessProfileClient from "./BusinessProfileClient"

export default function BusinessProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="app-hero-panel p-6 text-sm text-slate-500">
          Loading business profile...
        </div>
      }
    >
      <BusinessProfileClient />
    </Suspense>
  )
}
