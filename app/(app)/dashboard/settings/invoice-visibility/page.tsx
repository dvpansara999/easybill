import { Suspense } from "react"
import InvoiceVisibilityClient from "./visibilityClient"

export default function InvoiceVisibilityPage() {
  return (
    <Suspense
      fallback={
        <div className="soft-card rounded-[28px] p-6 text-sm text-slate-500">
          Loading invoice visibility…
        </div>
      }
    >
      <InvoiceVisibilityClient />
    </Suspense>
  )
}

