import { Suspense } from "react"
import CreateInvoiceClient from "./CreateInvoiceClient"

export default function CreateInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="soft-card rounded-[28px] p-6 text-sm text-slate-500">
          Loading invoice editor…
        </div>
      }
    >
      <CreateInvoiceClient />
    </Suspense>
  )
}
