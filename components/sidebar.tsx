"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useBusiness } from "@/context/BusinessContext"
import { signOut } from "@/lib/auth"
import { requestGuardedNavigation } from "@/lib/unsavedChangesGuard"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import {
  Blocks,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Users,
} from "lucide-react"

export default function Sidebar({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "drawer"
  onNavigate?: () => void
}) {

  const pathname = usePathname()
  const router = useRouter()
  const { business } = useBusiness()

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
    { name: "Templates", href: "/dashboard/templates", icon: Sparkles },
    { name: "Products", href: "/dashboard/products", icon: Blocks },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Business Profile", href: "/dashboard/business", icon: Building2 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Upgrade", href: "/dashboard/upgrade", icon: CreditCard },
    { name: "Sign Out", href: "#", icon: LogOut },
  ]

  const wrapClass =
    variant === "drawer"
      ? "glass-card flex w-full max-w-sm flex-col overflow-hidden rounded-[30px] max-h-[85vh]"
      : "glass-card sticky top-0 m-4 flex min-h-[calc(100vh-2rem)] w-[18.5rem] flex-col overflow-hidden rounded-[32px]"

  const navClass =
    variant === "drawer"
      ? "flex-1 space-y-2 overflow-y-auto px-3 py-4"
      : "flex-1 space-y-2 px-4 py-5"

  return (
    <aside className={wrapClass}>

      <div className="border-b border-white/10 bg-[linear-gradient(160deg,rgba(146,162,176,0.97),rgba(172,189,202,0.9),rgba(208,188,170,0.68))] px-6 py-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center">
              <EasyBillLogoMark size={44} className="drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.2em] text-white/70">easyBILL</p>
              <p className="text-sm font-semibold text-white/90">Invoice workspace</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/8 p-3 backdrop-blur-xl">
          {business?.logo ? (
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl ring-1 ring-white/15">
              <Image
                src={business.logo}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-sm font-bold">
              {business?.businessName?.charAt(0) || "B"}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{business?.businessName || "My Business"}</p>
            <p className="mt-0.5 truncate text-xs text-white/60">Your active business</p>
          </div>
        </div>
      </div>

      <nav className={navClass}>

        {navItems.map((item)=>{
          const Icon = item.icon
          const active = pathname===item.href

          if (item.name === "Sign Out") {
            return (
              <button
                key={item.name}
                onClick={() => {
                  requestGuardedNavigation(() => {
                    void signOut().finally(() => {
                      router.push("/")
                      onNavigate?.()
                    })
                  })
                }}
                className="flex w-full items-center gap-3 rounded-[1.15rem] px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-white/70 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(29,107,95,0.12)]"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                {item.name}
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault()
                if (active) {
                  onNavigate?.()
                  return
                }
                requestGuardedNavigation(() => {
                  router.push(item.href)
                  onNavigate?.()
                })
              }}
              className={`flex items-center gap-3 rounded-[1.15rem] px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(29,107,95,0.12)] ${
                active
                  ? "bg-[linear-gradient(135deg,rgba(136,153,169,0.98),rgba(162,181,196,0.94))] text-white shadow-[0_18px_42px_rgba(86,94,106,0.14)]"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-emerald-300" : "text-slate-400"}`} />
              {item.name}
            </Link>
          )

        })}

      </nav>

    </aside>
  )

}
