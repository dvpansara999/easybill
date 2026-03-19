import { Suspense } from "react"
import InvoicesClient from "./InvoicesClient"

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="soft-card rounded-[28px] p-6 text-sm text-slate-500">
          Loading invoices…
        </div>
      }
    >
      <InvoicesClient />
    </Suspense>
  )
}
