"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Inter } from "next/font/google"
import Link from "next/link"
import { useRouter } from "next/navigation"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import LandingInvoicePreview from "@/components/templatePreview/LandingInvoicePreview"
import { signIn, signInWithOtp, signInWithProvider, signOut, signUp, updatePasswordAfterOtp, verifyEmailOtp } from "@/lib/auth"
import { runSeedAndScopeMigration } from "@/lib/seedDataMigration"
import { emptySetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { createSupabaseBrowserClient, getSupabaseUser } from "@/lib/supabase/browser"
import { getActiveOrGlobalItem, setActiveOrGlobalItem } from "@/lib/userStore"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Cloud,
  CreditCard,
  Download,
  FilePenLine,
  FileText,
  History,
  LayoutTemplate,
  LockKeyhole,
  Package,
  Palette,
  Receipt,
  Share2,
  Smartphone,
  Stars,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-auth-inter",
  display: "swap",
})

/** Mobile: 16px+ inputs (no iOS zoom), glass fields; sm+: compact solid fields; lg+: desktop glass. */
const landingAuthInputClass = cn(
  "w-full min-h-[50px] rounded-2xl border border-white/45 bg-white/55 px-4 py-3.5 text-[16px] leading-snug text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:text-slate-500 focus:border-indigo-400 focus:ring-[3px] focus:ring-indigo-200/90 backdrop-blur-md",
  "md:min-h-0 md:border-slate-200 md:bg-white md:px-4 md:py-3 md:text-sm md:shadow-sm md:backdrop-blur-none md:focus:ring-4 md:focus:ring-indigo-100",
  "lg:border-white/22 lg:bg-white/24 lg:backdrop-blur-md"
)

const landingAuthInputDisabledClass = cn(
  landingAuthInputClass,
  "disabled:cursor-not-allowed disabled:border-white/30 disabled:bg-white/35 disabled:opacity-75 md:disabled:bg-slate-100 md:disabled:opacity-100 lg:disabled:bg-white/15"
)

const LANDING_FEATURE_TONES = ["emerald", "indigo", "sky", "rose"] as const

const LANDING_FEATURES: { title: string; desc: string; icon: LucideIcon }[] = [
  {
    title: "Go digital",
    desc: "Create, share, and store invoices digitally - less paper on your desk.",
    icon: BadgeCheck,
  },
  {
    title: "100+ templates",
    desc: "Modern, minimal, and classic layouts - pick what fits your brand.",
    icon: LayoutTemplate,
  },
  {
    title: "A4 PDF export",
    desc: "Print-ready PDFs that look professional every time.",
    icon: FileText,
  },
  {
    title: "Saved catalog",
    desc: "Reuse products and customers - build invoices in seconds.",
    icon: Package,
  },
  {
    title: "Encrypted fields",
    desc: "Sensitive data is protected with end-to-end encryption.",
    icon: LockKeyhole,
  },
  {
    title: "GST-ready",
    desc: "CGST, SGST, and IGST lines that match how you bill in India.",
    icon: Receipt,
  },
  {
    title: "Logo & branding",
    desc: "Your logo and business details on every invoice.",
    icon: Palette,
  },
  {
    title: "Cloud sync",
    desc: "Sign in on any device and pick up where you left off.",
    icon: Cloud,
  },
  {
    title: "Bank & UPI",
    desc: "Show bank, IFSC, and UPI on the invoice for faster payments.",
    icon: Banknote,
  },
  {
    title: "Fast workflow",
    desc: "A calm UI with smart defaults - built for daily billing.",
    icon: Zap,
  },
  {
    title: "Invoice history",
    desc: "Track drafts and sent invoices in one place.",
    icon: History,
  },
  {
    title: "Share anywhere",
    desc: "Download or share PDFs whenever your client needs them.",
    icon: Share2,
  },
  {
    title: "Works on mobile",
    desc: "Create and manage invoices from your phone with the same clean UI.",
    icon: Smartphone,
  },
  {
    title: "Instant download",
    desc: "Export PDFs in one tap - ready to send or print.",
    icon: Download,
  },
  {
    title: "Notes & terms",
    desc: "Add payment terms, footnotes, and custom copy to every invoice.",
    icon: FilePenLine,
  },
  {
    title: "Business insights",
    desc: "See activity and totals on your dashboard at a glance.",
    icon: BarChart3,
  },
]

const LANDING_SEO_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gst-invoice-generator", label: "GST invoice generator" },
  { href: "/invoice-templates", label: "Invoice templates" },
  { href: "/create-invoice-online", label: "Create invoice online" },
  { href: "/download-invoice-pdf", label: "Download invoice PDF" },
  { href: "/billing-software-for-small-business", label: "Billing software for small business" },
  { href: "/free-invoice-generator", label: "Free invoice generator" },
]

const LANDING_TRUST_METRICS = [
  { label: "Setup", value: "Under 2 min", detail: "Email, Google, and business profile." },
  { label: "Output", value: "A4 perfect", detail: "Preview, view, and export stay aligned." },
  { label: "Flow", value: "Cloud-synced", detail: "Invoices, templates, and settings stay ready." },
] as const

const LANDING_WORKFLOW_STEPS = [
  {
    title: "Open a polished workspace",
    desc: "Start with business identity, numbering, and template defaults that already feel finished.",
    icon: Cloud,
  },
  {
    title: "Shape invoices visually",
    desc: "Use the same live template system your clients will ultimately receive in exported PDF.",
    icon: LayoutTemplate,
  },
  {
    title: "Send with confidence",
    desc: "Keep status, exports, history, and share-ready documents attached to one invoice record.",
    icon: Share2,
  },
] as const

const LANDING_PREVIEW_PROOFS = [
  {
    title: "Send invoices that already look client-ready",
    desc: "The preview is not a marketing mockup. It is the same invoice system used when you share or export.",
    icon: FileText,
  },
  {
    title: "Keep billing faster after day one",
    desc: "Saved customers, products, branding, and templates reduce repeat work every time you return.",
    icon: Zap,
  },
  {
    title: "Keep branding consistent on every invoice",
    desc: "Your business details, logo, numbering, and template choices stay aligned across the full workflow.",
    icon: Palette,
  },
  {
    title: "Work from anywhere without starting over",
    desc: "Sign in on any device and continue with saved invoices, customers, and settings already in place.",
    icon: Cloud,
  },
] as const

const MOBILE_HERO_POINTS = [
  "Client-ready invoices",
  "A4-perfect PDF export",
  "Saved customers and products",
] as const

type AuthStory = {
  eyebrow: string
  title: string
  description: string
  chip: string
  stat: string
  icon: LucideIcon
  toneClasses: string
}

const AUTH_CREATE_STORIES: AuthStory[] = [
  {
    eyebrow: "Workspace setup",
    title: "Start with a calm billing base",
    description: "Open your workspace, add your business details, and move into invoicing without a cluttered setup ritual.",
    chip: "Fast onboarding",
    stat: "Business profile, numbering, logo",
    icon: Cloud,
    toneClasses: "from-emerald-100/90 via-white/80 to-sky-100/80 text-emerald-900",
  },
  {
    eyebrow: "Template flow",
    title: "See the same polish your clients will see",
    description: "Templates, typography, and exported PDFs follow one visual system, so nothing feels improvised later.",
    chip: "Template-ready",
    stat: "Preview, style, export",
    icon: LayoutTemplate,
    toneClasses: "from-indigo-100/90 via-white/80 to-sky-100/70 text-indigo-900",
  },
  {
    eyebrow: "Daily speed",
    title: "Create once, reuse everywhere",
    description: "Customers, products, and settings stay saved, so invoicing gets faster after the first session, not slower.",
    chip: "Built for repeat work",
    stat: "Catalog, history, dashboard",
    icon: FileText,
    toneClasses: "from-sky-100/85 via-white/80 to-emerald-100/70 text-sky-900",
  },
]

const AUTH_SIGNIN_STORIES: AuthStory[] = [
  {
    eyebrow: "Continuity",
    title: "Return to the exact workspace you left",
    description: "Invoices, customers, templates, and settings stay tied together, so there is no restart cost when you sign back in.",
    chip: "Resume instantly",
    stat: "Dashboard, templates, exports",
    icon: History,
    toneClasses: "from-indigo-100/90 via-white/80 to-sky-100/75 text-indigo-900",
  },
  {
    eyebrow: "Export workflow",
    title: "PDF actions stay attached to the same invoice",
    description: "Downloads, sharing, status updates, and timeline history stay connected to one saved invoice record.",
    chip: "Stable PDF flow",
    stat: "Draft, issued, paid",
    icon: Download,
    toneClasses: "from-emerald-100/90 via-white/80 to-white/70 text-emerald-900",
  },
  {
    eyebrow: "One workspace",
    title: "Business details, branding, and data stay in sync",
    description: "Your logo, numbering, business profile, and saved records stay aligned across the full billing workflow.",
    chip: "Everything in one place",
    stat: "Logo, settings, cloud sync",
    icon: Users,
    toneClasses: "from-sky-100/90 via-white/80 to-indigo-100/70 text-sky-900",
  },
]

const LandingStack = memo(function LandingStack({
  onLoginClick,
  onSignUpClick,
}: {
  onLoginClick: () => void
  onSignUpClick: () => void
}) {
  const spotlightFeatures = LANDING_FEATURES.slice(0, 6)
  const mobileSpotlightFeatures = LANDING_FEATURES.slice(0, 3)
  const mobilePreviewProofs = LANDING_PREVIEW_PROOFS.slice(0, 2)

  return (
    <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 sm:gap-10 lg:gap-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <EasyBillLogoMark size={48} className="shrink-0 drop-shadow sm:hidden" />
          <EasyBillLogoMark size={54} className="hidden shrink-0 drop-shadow sm:block" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">easyBILL</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 sm:text-xs">Create • Send • Track</p>
          </div>
        </div>
        <div className="hidden items-center gap-2.5 lg:flex">
          <div className="rounded-full border border-white/36 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 backdrop-blur-xl">
            Built for daily billing
          </div>
          <button
            type="button"
            onClick={onLoginClick}
            className="shrink-0 touch-manipulation rounded-full border border-white/45 bg-white/55 px-4 py-2.5 text-[13px] font-semibold text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md transition-[opacity,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 md:border-slate-200/80 md:bg-white/90 md:px-6 md:py-3 md:text-[15px] md:shadow-sm md:backdrop-blur-none md:focus-visible:ring-4 md:focus-visible:ring-indigo-100 lg:border-white/48 lg:bg-white/14 lg:shadow-[0_12px_40px_rgba(15,23,42,0.08)] lg:backdrop-blur-xl"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onSignUpClick}
            className="hidden rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_12px_34px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 sm:inline-flex sm:items-center sm:justify-center md:px-6 md:py-3 md:text-[15px]"
          >
            Create account
          </button>
        </div>
      </header>

      <div className="sm:hidden">
        <div className="auth-glass-desktop relative overflow-hidden rounded-[1.7rem] border border-white/30 bg-white/20 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(99,102,241,0.18),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.18),transparent_28%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/34 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-900 backdrop-blur-xl">
              <Stars className="h-3.5 w-3.5" />
              Polished billing from day one
            </div>

            <h1 className="mt-4 max-w-[9ch] text-balance text-[clamp(2.35rem,12vw,3.3rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-slate-950">
              Professional invoices, made easy.
            </h1>

            <p className="mt-4 max-w-md text-[15px] leading-7 text-slate-600">
              Start fast, send professional invoices, and keep your billing workflow clean without a heavy setup.
            </p>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={onSignUpClick}
                className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)]"
              >
                Start your workspace
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onLoginClick}
                className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/38 bg-white/34 px-5 py-3.5 text-[15px] font-semibold text-slate-900 backdrop-blur-xl"
              >
                Sign in and continue
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {MOBILE_HERO_POINTS.map((point) => (
                <div
                  key={point}
                  className="rounded-full border border-white/32 bg-white/30 px-3.5 py-2 text-[11px] font-semibold text-slate-700 backdrop-blur-xl"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-stretch">
        <div className="order-2 lg:order-1">
          <div className="auth-glass-desktop relative hidden h-full overflow-hidden rounded-[1.7rem] border border-white/28 bg-white/18 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.09)] backdrop-blur-2xl sm:block sm:rounded-[2rem] sm:p-8 lg:rounded-[2.9rem] lg:px-10 lg:py-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_32%),radial-gradient(circle_at_78%_16%,rgba(99,102,241,0.2),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.2),transparent_28%),linear-gradient(140deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/34 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-900 backdrop-blur-xl">
                <Stars className="h-4 w-4" />
                Made for businesses that want polished billing
              </div>

              <h1 className="mt-5 max-w-[9.5ch] text-balance text-[clamp(2.55rem,12vw,5rem)] font-semibold leading-[0.92] tracking-[-0.075em] text-slate-950 sm:mt-7 sm:max-w-[11ch] sm:leading-[0.9]">
                The first billing workspace that already feels premium before sign-up.
              </h1>

              <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-7 text-slate-600 sm:mt-6 sm:text-base sm:leading-8 lg:text-[1.05rem]">
                Create polished invoices, save customers and products, and export A4-perfect PDFs from a workspace that keeps billing clear, fast, and professional from the very first session.
              </p>

              <div className="mt-6 hidden flex-col gap-3 sm:flex sm:flex-row">
                <button
                  type="button"
                  onClick={onSignUpClick}
                  className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-base font-semibold text-white shadow-[0_24px_58px_rgba(15,23,42,0.22)] transition hover:bg-slate-800"
                >
                  Start your workspace
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="inline-flex min-h-[58px] items-center justify-center rounded-2xl border border-white/36 bg-white/35 px-7 py-4 text-base font-semibold text-slate-900 backdrop-blur-xl transition hover:bg-white/48"
                >
                  Sign in and continue billing
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-9 sm:grid-cols-3">
                {LANDING_TRUST_METRICS.map((item) => (
                  <div key={item.label} className="rounded-[1.7rem] border border-white/30 bg-white/32 p-4 backdrop-blur-xl">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-[1.95rem] font-semibold tracking-[-0.06em] text-slate-950">{item.value}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:mt-9 sm:grid-cols-3">
                {LANDING_WORKFLOW_STEPS.map(({ title, desc, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-[1.7rem] border border-white/28 bg-white/20 p-5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/28"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-white/72 text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-[1.22rem] font-semibold tracking-[-0.05em] text-slate-950">{title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8">
                {LANDING_SEO_LINKS.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center rounded-full border border-white/32 bg-white/28 px-4 py-2.5 text-sm font-medium text-slate-700 backdrop-blur-xl transition hover:bg-white/42 hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="auth-glass-desktop relative h-full overflow-hidden rounded-[1.7rem] border border-white/28 bg-white/18 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.09)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-4 lg:rounded-[2.9rem] lg:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.7),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_52%_94%,rgba(59,130,246,0.14),transparent_24%)]" />
            <div className="relative">
              <div className="flex flex-col gap-2 px-1 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/34 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700 backdrop-blur-xl">
                  <Download className="h-4 w-4 text-indigo-700" />
                  Real invoice preview
                </div>
                <div className="inline-flex w-fit rounded-full border border-white/32 bg-white/30 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-xl">
                  Templates, exports, and cloud sync
                </div>
              </div>

              <div>
                <div
                  className="transition-transform duration-500 ease-out lg:[transform:perspective(1600px)_rotateX(3deg)_rotateY(-4deg)] lg:hover:[transform:perspective(1600px)_rotateX(1deg)_rotateY(-1deg)_translateY(-8px)]"
                  style={{ transformOrigin: "center top" }}
                >
                  <LandingInvoicePreview />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:hidden">
                {mobileSpotlightFeatures.map((item, index) => {
                  const Icon = item.icon
                  const tone = LANDING_FEATURE_TONES[index % LANDING_FEATURE_TONES.length]
                  const toneClasses =
                    tone === 'indigo'
                      ? 'bg-indigo-500/18 text-indigo-800'
                      : tone === 'emerald'
                        ? 'bg-emerald-500/18 text-emerald-800'
                        : tone === 'sky'
                          ? 'bg-sky-500/18 text-sky-800'
                          : 'bg-rose-500/18 text-rose-800'

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.45rem] border border-white/28 bg-white/24 p-4 backdrop-blur-xl"
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', toneClasses)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-600">{item.desc}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 hidden gap-3 sm:mt-5 sm:grid sm:grid-cols-2 lg:grid-cols-2">
                {spotlightFeatures.map((item, index) => {
                  const Icon = item.icon
                  const tone = LANDING_FEATURE_TONES[index % LANDING_FEATURE_TONES.length]
                  const toneClasses =
                    tone === 'indigo'
                      ? 'bg-indigo-500/18 text-indigo-800'
                      : tone === 'emerald'
                        ? 'bg-emerald-500/18 text-emerald-800'
                        : tone === 'sky'
                          ? 'bg-sky-500/18 text-sky-800'
                          : 'bg-rose-500/18 text-rose-800'

                  return (
                    <div
                      key={item.title}
                      className="rounded-[1.55rem] border border-white/28 bg-white/24 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/34"
                    >
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', toneClasses)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs leading-6 text-slate-600">{item.desc}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 rounded-[1.7rem] border border-white/28 bg-white/24 p-4 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] bg-slate-950 text-white shadow-[0_16px_32px_rgba(15,23,42,0.14)]">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">What you can expect</p>
                    <p className="mt-2 text-[1.12rem] font-semibold tracking-[-0.04em] text-slate-950">
                      Start with the same polished invoice system you will use when it is time to send, download, or print.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Choose a template, add your details, and get a professional invoice workflow without rebuilding your process from scratch.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:hidden">
                {mobilePreviewProofs.map(({ title, desc, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-[1.55rem] border border-white/28 bg-white/22 p-4 backdrop-blur-xl"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[1rem] font-semibold leading-6 tracking-[-0.03em] text-slate-950">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-2">
                {LANDING_PREVIEW_PROOFS.map(({ title, desc, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-[1.65rem] border border-white/28 bg-white/22 p-4 backdrop-blur-xl"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-[1.02rem] font-semibold leading-6 tracking-[-0.03em] text-slate-950">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  )
})

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "create">("signin")
  const [signinEmail, setSigninEmail] = useState("")
  const [signinPassword, setSigninPassword] = useState("")
  const [signinError, setSigninError] = useState("")
  const [createErrorMessage, setCreateErrorMessage] = useState("")
  const [createOtpMessage, setCreateOtpMessage] = useState("")
  const [primaryBusy, setPrimaryBusy] = useState(false)
  const [oauthBusy, setOauthBusy] = useState(false)
  const [otpMode, setOtpMode] = useState<"create" | "signin" | null>(null)
  const [otpEmail, setOtpEmail] = useState("")
  const [otpToken, setOtpToken] = useState("")
  const [otpVerifyError, setOtpVerifyError] = useState("")
  const [otpBusy, setOtpBusy] = useState(false)
  const [showSigninPassword, setShowSigninPassword] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotOtpCode, setForgotOtpCode] = useState("")
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false)
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("")
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false)
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false)
  const [forgotBusy, setForgotBusy] = useState(false)
  const [forgotError, setForgotError] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const authPanelRef = useRef<HTMLElement>(null)

  function scrollAuthIntoView() {
    requestAnimationFrame(() => {
      authPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  useEffect(() => {
    runSeedAndScopeMigration()
  }, [])

  const panelCopy = useMemo(() => {
    if (mode === "create") {
      return {
        eyebrow: "Create Account",
        title: "Create your easyBILL workspace in minutes.",
        description:
          "Set up your business, choose a template style, and start sending clean, professional invoices from day one.",
        primary: "Create Account",
        secondary: "Already have an account?",
        switchLabel: "Sign In",
      }
    }

    return {
      eyebrow: "Sign In",
      title: "Welcome back to easyBILL.",
      description:
        "Jump into your dashboard and continue where you left off - invoices, customers, templates, and settings.",
      primary: "Sign In",
      secondary: "Need a new workspace?",
      switchLabel: "Create Account",
    }
  }, [mode])

  const authStories = useMemo(() => (mode === "create" ? AUTH_CREATE_STORIES : AUTH_SIGNIN_STORIES), [mode])
  const primaryAuthStory = authStories[0]

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const passwordIsValid =
    /[A-Z]/.test(createPassword) &&
    /[a-z]/.test(createPassword) &&
    /\d/.test(createPassword) &&
    /[^A-Za-z0-9]/.test(createPassword) &&
    createPassword.length >= 7 &&
    createPassword.length <= 20
  const passwordsMatch = createPassword === confirmPassword && confirmPassword.length > 0

  const createErrors = {
    businessName: !businessName.trim() ? "Business name is required." : "",
    email: !email.trim()
      ? "Email is required."
      : !emailIsValid
        ? "Enter a valid email address."
        : "",
    createPassword: !createPassword
      ? "Create password is required."
      : !passwordIsValid
        ? "Use 7-20 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character."
        : "",
    confirmPassword: !confirmPassword
      ? "Confirm password is required."
      : !passwordsMatch
        ? "Passwords must match exactly."
        : "",
    acceptTerms: !acceptTerms ? "You must accept Terms and Conditions to create an account." : "",
  }

  const createFormValid =
    !createErrors.businessName &&
    !createErrors.email &&
    !createErrors.createPassword &&
    !createErrors.confirmPassword &&
    !createErrors.acceptTerms

  const forgotPasswordIsValid =
    /[A-Z]/.test(forgotNewPassword) &&
    /[a-z]/.test(forgotNewPassword) &&
    /\d/.test(forgotNewPassword) &&
    /[^A-Za-z0-9]/.test(forgotNewPassword) &&
    forgotNewPassword.length >= 7 &&
    forgotNewPassword.length <= 20

  function handleTrackedInput(field: string, setter: (next: string) => void, next: string) {
    if (typeof window === "undefined") {
      setter(next)
      return
    }
    const isMobile = window.matchMedia("(max-width: 1023px)").matches
    if (!isMobile) {
      setter(next)
      return
    }
    setter(next)
  }

  async function handlePrimaryAction() {
    if (primaryBusy) return
    setPrimaryBusy(true)
    setSigninError("")
    setCreateErrorMessage("")
    setCreateOtpMessage("")
    // OTP messages should be cleared when starting a new action.
    setOtpVerifyError("")
    if (mode === "create") {
      setAttemptedSubmit(true)

      if (!createFormValid) {
        return
      }

      const { getActiveOrGlobalItem } = await import("@/lib/userStore")
      const existingDraftRaw = getActiveOrGlobalItem("setupProfileDraft")
      const resumePath = getActiveOrGlobalItem("setupResumePath")

      // If a previous user is still authenticated in this browser (tab closed but session persisted),
      // switching accounts during "Create Account" must not reuse the old user's setup resume/draft.
      // So we force sign-out and clear temporary setup resume/draft before starting the new OTP flow.
      try {
        const { data } = await getSupabaseUser()
        if (data.user) {
          await signOut()
          try {
            localStorage.removeItem("setupProfileDraft")
            localStorage.removeItem("setupResumePath")
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore; we'll still proceed with current auth mode behavior
      }

      // If a draft exists, we still MUST complete OTP before entering setup.
      // Otherwise we can bypass RLS + confusing UX.
      let isAlreadyAuthenticated = false
      try {
        const { data } = await getSupabaseUser()
        isAlreadyAuthenticated = Boolean(data.user)
      } catch {
        isAlreadyAuthenticated = false
      }

      if (isAlreadyAuthenticated && existingDraftRaw && resumePath?.startsWith("/setup/profile")) {
        try {
          const parsed = JSON.parse(existingDraftRaw) as { businessName?: string; email?: string }
          if (parsed?.businessName && parsed?.email) {
            router.push(resumePath)
            return
          }
        } catch {
          // ignore broken draft
        }
      }

      // Save identity draft so step-1 can prefill after the OTP link is clicked.
      // No authenticated session exists yet, so this is stored locally and later synced into the relational profile/settings rows.
      try {
        localStorage.removeItem("setupProfileDraft")
        localStorage.removeItem("setupResumePath")
      } catch {
        // ignore
      }
      saveSetupProfileDraft({
        ...emptySetupProfileDraft,
        businessName: businessName.trim(),
        email: email.trim(),
        emailLocked: false,
      })

      // Create the account (sends "Confirm sign up" OTP/email) but do not enter setup
      // until the OTP is verified by the user on this page.
      const { error } = await signUp(email.trim(), createPassword)
      if (error) {
        setCreateErrorMessage(error)
        return
      }

      setOtpMode("create")
      setOtpEmail(email.trim())
      setOtpToken("")
      setOtpVerifyError("")
      setCreateOtpMessage("We sent an OTP code to your email. Enter it below to continue setup.")
      return
    }

    const { error } = await signIn(signinEmail, signinPassword)
    if (error) {
      setSigninError(error)
      setPrimaryBusy(false)
      return
    }

    // Avoid cross-user leakage from leftover global setup keys.
    // Setup draft/resume are stored as user-scoped localStorage after OTP/steps.
    try {
      localStorage.removeItem("setupProfileDraft")
      localStorage.removeItem("setupResumePath")
    } catch {
      // ignore
    }

    const waitForSignedInUser = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await getSupabaseUser()
        if (data.user?.id) return data.user.id
        await new Promise((resolve) => window.setTimeout(resolve, 200))
      }
      return null
    }

    // After sign-in, check onboarding completion from the relational profile row.
    const navigate = async () => {
      const supabase = createSupabaseBrowserClient()
      const userId = await waitForSignedInUser()
      if (!userId) {
        router.push("/dashboard")
        return
      }

      await Promise.allSettled([
        supabase.from("profiles").upsert({ user_id: userId, onboarding_completed: false }, { onConflict: "user_id" }),
        supabase.from("user_settings").upsert({ user_id: userId }, { onConflict: "user_id" }),
      ])

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed,business_name,address,phone,email")
        .eq("user_id", userId)
        .maybeSingle()

      const hasBusinessProfile = Boolean(
        profile?.onboarding_completed ||
          profile?.business_name ||
          profile?.address ||
          profile?.phone ||
          profile?.email
      )

      if (!hasBusinessProfile) {
        // Prepare Step-1 locally (email locked, business name blank until user edits).
        setActiveOrGlobalItem(
          "setupProfileDraft",
          JSON.stringify({
            ...emptySetupProfileDraft,
            businessName: "",
            email: signinEmail.trim(),
            emailLocked: false,
          })
        )
        setActiveOrGlobalItem("setupResumePath", "/setup/profile")
        router.push(`/setup/profile?businessName=&email=${encodeURIComponent(signinEmail.trim())}`)
        return
      }

      router.push("/dashboard")
    }

    void navigate()
  }

  async function startOAuth(provider: "google" | "apple") {
    if (oauthBusy) return
    setOauthBusy(true)
    setSigninError("")
    setCreateErrorMessage("")
    const { url, error } = await signInWithProvider(provider)
    if (error) {
      setSigninError(error)
      setOauthBusy(false)
      return
    }
    if (url) {
      window.location.href = url
    }
    setOauthBusy(false)
  }

  async function verifyOtpNow() {
    if (!otpMode) return
    if (!otpEmail.trim()) return
    if (!otpToken.trim()) {
      setOtpVerifyError("Enter the OTP code.")
      return
    }

    setOtpBusy(true)
    setOtpVerifyError("")

    const currentOtpMode = otpMode
    const currentEmail = otpEmail.trim()

    const otpType = currentOtpMode === "create" ? "signup" : "email"
    const { error } = await verifyEmailOtp(currentEmail, otpToken, otpType)
    if (error) {
      setOtpVerifyError(error)
      setOtpBusy(false)
      return
    }

    const waitForSignedInUser = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await getSupabaseUser()
        if (data.user?.id) return data.user.id
        await new Promise((resolve) => window.setTimeout(resolve, 200))
      }
      return null
    }

    async function navigate() {
      await waitForSignedInUser()
      const resumePath = getActiveOrGlobalItem("setupResumePath")
      const businessProfileRaw = getActiveOrGlobalItem("businessProfile")
      const hasBusinessProfile = Boolean(businessProfileRaw)

      const resumeIsSetup = typeof resumePath === "string" && resumePath.startsWith("/setup/profile")

      if (currentOtpMode === "create") {
        if (resumeIsSetup && resumePath) router.push(resumePath)
        else
          router.push(
            `/setup/profile?businessName=${encodeURIComponent(businessName.trim())}&email=${encodeURIComponent(currentEmail)}`
          )
        return
      }

      // signin
      if (hasBusinessProfile) router.push("/dashboard")
      else if (resumeIsSetup && resumePath) router.push(resumePath)
      else router.push("/setup/profile")
    }

    void navigate()
  }

  async function sendForgotOtp() {
    setForgotError("")
    setForgotMessage("")
    if (!forgotEmail.trim()) {
      setForgotError("Email is required.")
      return
    }
    setForgotBusy(true)
    const { error } = await signInWithOtp(forgotEmail.trim(), { shouldCreateUser: false })
    setForgotBusy(false)
    if (error) {
      const msg = error.toLowerCase()
      if (msg.includes("not found") || (msg.includes("user") && msg.includes("not") && msg.includes("exist"))) {
        setForgotError("User not found.")
      } else {
        setForgotError(error)
      }
      return
    }
    setForgotOtpSent(true)
    setForgotOtpVerified(false)
    setForgotOtpCode("")
    setForgotMessage("OTP sent. Enter the 6-digit code from your email.")
  }

  async function verifyForgotOtp() {
    setForgotError("")
    setForgotMessage("")
    if (forgotOtpCode.trim().length < 6) {
      setForgotError("Enter 6-digit OTP.")
      return
    }
    setForgotBusy(true)
    const { error } = await verifyEmailOtp(forgotEmail.trim(), forgotOtpCode.trim(), "email")
    setForgotBusy(false)
    if (error) {
      setForgotError(error)
      return
    }
    setForgotOtpVerified(true)
    setForgotMessage("OTP verified. Set your new password.")
  }

  async function updateForgotPassword() {
    setForgotError("")
    setForgotMessage("")
    if (!forgotOtpVerified) {
      setForgotError("Verify OTP first.")
      return
    }
    if (!forgotPasswordIsValid) {
      setForgotError("Use 7-20 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.")
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords must match exactly.")
      return
    }
    setForgotBusy(true)
    const { error } = await updatePasswordAfterOtp(forgotNewPassword)
    if (error) {
      setForgotBusy(false)
      setForgotError(error)
      return
    }
    await signOut()
    setForgotBusy(false)
    setForgotMessage("Password updated. Sign in with your new password.")
    setForgotOpen(false)
    setForgotOtpSent(false)
    setForgotOtpVerified(false)
    setForgotOtpCode("")
    setForgotNewPassword("")
    setForgotConfirmPassword("")
    setSigninPassword("")
  }

  function switchMode(next: "signin" | "create") {
    setMode(next)
    setAttemptedSubmit(false)
    setSigninError("")
    setCreateErrorMessage("")
    setCreateOtpMessage("")
    setOtpMode(null)
    setOtpEmail("")
    setOtpToken("")
    setOtpVerifyError("")
    setAcceptTerms(false)
    setForgotOpen(false)
    setForgotEmail("")
    setForgotOtpSent(false)
    setForgotOtpCode("")
    setForgotOtpVerified(false)
    setForgotNewPassword("")
    setForgotConfirmPassword("")
    setForgotError("")
    setForgotMessage("")
  }

  function showError(message: string, value: string) {
    return (attemptedSubmit || value.length > 0) && message
  }

  return (
    <main
      className={`${inter.variable} eb-safe-bottom-page relative min-h-screen overflow-x-hidden bg-[linear-gradient(155deg,#eef2fb_0%,#e4eaf7_28%,#eef1fb_55%,#e2e8f8_100%)] px-3.5 pt-3 [font-family:var(--font-auth-inter),ui-sans-serif,system-ui,sans-serif] sm:px-4 sm:py-8 lg:px-8 lg:py-10 lg:pb-10`}
    >
      <div className="auth-desktop-depth pointer-events-none absolute inset-0 z-0" aria-hidden />

      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.32]"
        style={{
          backgroundImage: "radial-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />

      <div className="relative z-[2] mx-auto w-full max-w-6xl px-0 sm:px-1">
        <div className="h-1 sm:h-4" />

        <div className="mt-3 flex flex-col gap-10 sm:mt-6 sm:gap-12 lg:mt-8 lg:gap-14">
          <LandingStack
            onLoginClick={() => {
              switchMode("signin")
              scrollAuthIntoView()
            }}
            onSignUpClick={() => {
              switchMode("create")
              scrollAuthIntoView()
            }}
          />

          <section ref={authPanelRef} id="account" className="scroll-mt-4 md:scroll-mt-10">
            <div className="mx-auto w-full max-w-[1120px]">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-6">
                <div className="hidden lg:block lg:pr-2">
                  <div
                    className={cn(
                      "auth-glass-desktop overflow-hidden text-left",
                      "rounded-[2.65rem] border border-white/28 !bg-white/[0.16] p-8 shadow-[0_32px_90px_rgba(15,23,42,0.1)] backdrop-blur-2xl"
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-[2.65rem] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.48),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.18),transparent_28%),radial-gradient(circle_at_28%_30%,rgba(99,102,241,0.14),transparent_24%)]" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/22 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-900 backdrop-blur-xl">
                        <Stars className="h-4 w-4" />
                        {mode === "create" ? "Start billing with less setup friction" : "Come back to work without losing momentum"}
                      </div>

                      <div className={cn("mt-6 rounded-[2rem] border border-white/26 bg-gradient-to-br p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]", primaryAuthStory?.toneClasses)}>
                        <div className="flex items-start justify-between gap-5">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                              {primaryAuthStory?.eyebrow}
                            </p>
                            <h2 className="mt-4 max-w-[13ch] text-balance text-[3rem] font-semibold leading-[0.96] tracking-[-0.06em] text-slate-950">
                              {primaryAuthStory?.title || panelCopy.title}
                            </h2>
                            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                              {primaryAuthStory?.description || panelCopy.description}
                            </p>
                          </div>
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                            {(() => {
                              const ActiveIcon = primaryAuthStory?.icon || Stars
                              return <ActiveIcon className="h-6 w-6" />
                            })()}
                          </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between gap-4 rounded-[24px] border border-white/35 bg-white/40 px-5 py-4 backdrop-blur-md">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current focus</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{primaryAuthStory?.chip}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Why it matters</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{primaryAuthStory?.stat}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4">
                        <div className="rounded-[1.8rem] border border-white/24 bg-white/18 p-5 backdrop-blur-xl">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">From account to first invoice</p>
                              <p className="mt-2 text-[1.55rem] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-950">
                                Create your account and move straight into polished, client-ready invoicing.
                              </p>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-white/80 text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.08)]">
                              <BadgeCheck className="h-5 w-5" />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                          {authStories.slice(1).map(({ eyebrow, title, description, chip, icon: Icon }) => (
                            <div
                              key={title}
                              className="rounded-[1.8rem] border border-white/24 bg-white/16 p-5 backdrop-blur-xl"
                            >
                              <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] bg-white/80 text-slate-900 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                                <Icon className="h-5 w-5" />
                              </div>
                              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
                              <h3 className="mt-2 text-[1.2rem] font-semibold leading-[1.06] tracking-[-0.04em] text-slate-950">{title}</h3>
                              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                              <div className="mt-4 inline-flex rounded-full border border-white/35 bg-white/30 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                                {chip}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="auth-glass-desktop-inset rounded-[1.5rem] border border-white/30 bg-white/22 p-4 sm:p-5 lg:hidden">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)]">
                      {(() => {
                        const MobileStoryIcon = primaryAuthStory?.icon || Stars
                        return <MobileStoryIcon className="h-5 w-5" />
                      })()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                        {primaryAuthStory?.eyebrow || panelCopy.eyebrow}
                      </p>
                      <h2 className="mt-2 text-[1.55rem] font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950">
                        {primaryAuthStory?.title || panelCopy.title}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {primaryAuthStory?.description || panelCopy.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="rounded-full border border-white/35 bg-white/34 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                          {primaryAuthStory?.chip}
                        </div>
                        <div className="rounded-full border border-white/35 bg-white/34 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                          {primaryAuthStory?.stat}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "auth-glass-desktop mx-auto w-full max-w-[620px] overflow-hidden text-left lg:mx-0 lg:max-w-none",
                    "rounded-[1.5rem] border border-white/45 !bg-white/[0.52] shadow-[0_24px_64px_rgba(15,23,42,0.12)] ring-1 ring-white/25 backdrop-blur-2xl",
                    "md:rounded-[34px] md:border-slate-200/90 md:!bg-white/80 md:shadow-[0_30px_90px_rgba(15,23,42,0.10)] md:ring-0 md:backdrop-blur-md",
                    "lg:rounded-[2.5rem] lg:border-white/28 lg:!bg-white/[0.18] lg:shadow-[0_32px_90px_rgba(15,23,42,0.1)] lg:backdrop-blur-2xl"
                  )}
                >
                  <div
                    className={cn(
                      "border-b px-4 py-4 md:px-7 md:py-6 lg:px-8 lg:py-7",
                      "border-white/25 bg-white/30 backdrop-blur-xl",
                      "md:border-slate-200 md:bg-white/60 md:backdrop-blur-none",
                      "lg:border-white/22 lg:bg-white/12 lg:backdrop-blur-xl"
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between lg:flex-col lg:items-start lg:justify-start lg:gap-5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-700 md:text-xs md:tracking-[0.32em]">
                          {panelCopy.eyebrow}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950 md:text-[2rem] lg:text-[2.3rem] lg:leading-[1.02]">
                          {mode === "create" ? "Open your workspace" : "Return to your workspace"}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-slate-600 md:text-sm md:leading-6 lg:max-w-xl">
                          {mode === "create"
                            ? "Start with Google or email, verify once, and move directly into business setup."
                            : "Sign in to pick up invoices, customers, templates, settings, and exports exactly where you left them."}
                        </p>
                        <div className="mt-4 hidden items-center gap-2 lg:flex">
                          <div className="rounded-full border border-white/30 bg-white/24 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                            Google or email
                          </div>
                          <div className="rounded-full border border-white/30 bg-white/24 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                            Resume anytime
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "grid w-full shrink-0 grid-cols-2 gap-1 rounded-2xl border p-1 text-[15px] font-semibold leading-none md:w-auto md:max-w-none md:gap-2 md:rounded-full md:p-1 md:text-sm lg:w-full lg:max-w-[340px]",
                          "border-white/40 bg-white/35 backdrop-blur-md lg:auth-glass-desktop-inset",
                          "md:border-slate-200 md:bg-white"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => switchMode("signin")}
                          className={cn(
                            "touch-manipulation rounded-xl px-3 py-3.5 text-center transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] md:rounded-full md:px-5 md:py-2.5 lg:text-[15px]",
                            mode === "signin"
                              ? "bg-slate-950 text-white shadow-[0_6px_20px_rgba(15,23,42,0.2)]"
                              : "text-slate-600 active:bg-white/50 md:hover:text-slate-950 md:hover:opacity-90"
                          )}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => switchMode("create")}
                          className={cn(
                            "touch-manipulation rounded-xl px-3 py-3.5 text-center transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] md:rounded-full md:px-5 md:py-2.5 lg:text-[15px]",
                            mode === "create"
                              ? "bg-slate-950 text-white shadow-[0_6px_20px_rgba(15,23,42,0.2)]"
                              : "text-slate-600 active:bg-white/50 md:hover:text-slate-950 md:hover:opacity-90"
                          )}
                        >
                          Create account
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-5 md:px-7 md:py-7 lg:px-8 lg:py-8">
                <div className="grid gap-4 max-md:gap-3.5">
                  <div className="mx-auto grid w-full max-w-sm gap-3">
                    <button
                      type="button"
                      onClick={() => startOAuth("google")}
                      disabled={oauthBusy}
                      className={cn(
                        "inline-flex w-full min-h-[52px] touch-manipulation items-center justify-center rounded-2xl border px-4 py-3.5 text-[15px] font-semibold transition-[opacity,background-color,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[48px] md:py-3 md:text-sm",
                        "border-white/45 bg-white/55 text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md active:bg-white/70",
                        "md:border-slate-200 md:bg-white md:shadow-none md:backdrop-blur-none md:hover:bg-slate-50 md:hover:opacity-95",
                        "lg:min-h-[52px] lg:border-white/28 lg:bg-white/22 lg:px-5 lg:py-3.5 lg:text-base lg:backdrop-blur-md lg:hover:bg-white/30 lg:hover:opacity-90"
                      )}
                    >
                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        className="mr-2 inline-block h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill="#EA4335"
                          d="M12 10.2v3.6h4.86c-.2 1.1-.88 2.05-1.88 2.67v2.39h3.05c1.78-1.64 2.8-4.06 2.8-6.93 0-.74-.07-1.46-.2-2.16H12z"
                        />
                        <path
                          fill="#4285F4"
                          d="M12 21.6c2.53 0 4.65-.84 6.2-2.28l-3.05-2.39c-.84.56-1.98.9-3.15.9-2.4 0-4.44-1.62-5.17-3.8H3.6v2.45c1.55 3.07 4.72 5.12 8.4 5.12z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M6.83 14.03A6.52 6.52 0 0 1 6.5 12c0-.72.13-1.41.34-2.03V7.52H3.6C2.93 8.9 2.55 10.34 2.55 12c0 1.66.38 3.1 1.05 4.48l3.23-2.45z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 5.45c1.38 0 2.6.48 3.57 1.43l2.68-2.68C16.65 2.7 14.53 1.8 12 1.8c-3.68 0-6.85 2.05-8.4 5.12l3.23 2.45c.73-2.18 2.77-3.8 5.17-3.8z"
                        />
                      </svg>
                      {oauthBusy ? "Connecting..." : "Continue with Google"}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 py-0.5 max-md:gap-2.5">
                    <div className="h-px flex-1 bg-white/50 md:bg-slate-200" />
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500 md:text-xs md:tracking-[0.28em]">
                      or
                    </span>
                    <div className="h-px flex-1 bg-white/50 md:bg-slate-200" />
                  </div>

                  {mode === "create" ? (
                    <>
                      <div>
                        <label htmlFor="create-business-name" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Business name</label>
                        <input
                          id="create-business-name"
                          name="businessName"
                          type="text"
                          placeholder="e.g. ABC Traders"
                          value={businessName}
                          onChange={(e) => handleTrackedInput("businessName", setBusinessName, e.target.value)}
                          className={landingAuthInputClass}
                        />
                        {showError(createErrors.businessName, businessName) && (
                          <p className="mt-2 text-sm text-rose-600">{createErrors.businessName}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="create-email" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Email</label>
                        <input
                          id="create-email"
                          name="email"
                          type="email"
                          placeholder="you@business.com"
                          value={email}
                          onChange={(e) => handleTrackedInput("createEmail", setEmail, e.target.value)}
                          className={landingAuthInputClass}
                        />
                        {showError(createErrors.email, email) && (
                          <p className="mt-2 text-sm text-rose-600">{createErrors.email}</p>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="create-password" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Create password</label>
                          <input
                            id="create-password"
                            name="createPassword"
                            type={showCreatePassword ? "text" : "password"}
                            placeholder="7-20 characters"
                            value={createPassword}
                            onChange={(e) => handleTrackedInput("createPassword", setCreatePassword, e.target.value)}
                            className={landingAuthInputClass}
                          />
                          {showError(createErrors.createPassword, createPassword) && (
                            <p className="mt-2 text-sm text-rose-600">{createErrors.createPassword}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="create-confirm-password" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Confirm password</label>
                          <input
                            id="create-confirm-password"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="re-enter password"
                            value={confirmPassword}
                            onChange={(e) => handleTrackedInput("confirmPassword", setConfirmPassword, e.target.value)}
                            className={landingAuthInputClass}
                          />
                          {showError(createErrors.confirmPassword, confirmPassword) && (
                            <p className="mt-2 text-sm text-rose-600">{createErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>

                      <label className="mt-1 inline-flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-3 rounded-xl py-1 text-sm text-slate-600 max-md:px-0.5 max-md:active:bg-white/30 md:min-h-0 md:gap-2 md:py-0">
                        <input
                          name="showCreatePassword"
                          type="checkbox"
                          checked={showCreatePassword && showConfirmPassword}
                          onChange={(e) => {
                            setShowCreatePassword(e.target.checked)
                            setShowConfirmPassword(e.target.checked)
                          }}
                          className="h-[18px] w-[18px] shrink-0 rounded border-slate-400 md:h-4 md:w-4"
                        />
                        Show password
                      </label>

                      <label className="inline-flex min-h-[48px] cursor-pointer touch-manipulation items-start gap-3 rounded-xl py-1 text-sm text-slate-600 max-md:px-0.5 max-md:active:bg-white/25 md:min-h-0 md:gap-2 md:py-0">
                        <input
                          name="acceptTerms"
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-slate-400 md:h-4 md:w-4"
                        />
                        <span className="leading-relaxed">
                          I agree to the Terms and Conditions.{" "}
                          <a
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-slate-950 underline underline-offset-4"
                          >
                            Click here for more info
                          </a>
                          .
                        </span>
                      </label>
                      {showError(createErrors.acceptTerms, acceptTerms ? "1" : "") && (
                        <p className="-mt-1 text-sm text-rose-600">{createErrors.acceptTerms}</p>
                      )}

                      {createErrorMessage ? <p className="-mt-1 text-sm text-rose-600">{createErrorMessage}</p> : null}
                      {createOtpMessage ? <p className="-mt-1 text-sm text-emerald-700">{createOtpMessage}</p> : null}
                    </>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="signin-email" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Email</label>
                        <input
                          id="signin-email"
                          name="signinEmail"
                          type="text"
                          placeholder="you@business.com"
                          value={signinEmail}
                          onChange={(e) => handleTrackedInput("signinEmail", setSigninEmail, e.target.value)}
                          className={landingAuthInputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="signin-password" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Password</label>
                        <input
                          id="signin-password"
                          name="signinPassword"
                          type={showSigninPassword ? "text" : "password"}
                          placeholder="Your password"
                          value={signinPassword}
                          onChange={(e) => handleTrackedInput("signinPassword", setSigninPassword, e.target.value)}
                          className={landingAuthInputClass}
                        />
                      </div>

                      <label className="mt-1 inline-flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-3 rounded-xl py-1 text-sm text-slate-600 max-md:px-0.5 max-md:active:bg-white/30 md:min-h-0 md:gap-2 md:py-0">
                        <input
                          name="showSigninPassword"
                          type="checkbox"
                          checked={showSigninPassword}
                          onChange={(e) => setShowSigninPassword(e.target.checked)}
                          className="h-[18px] w-[18px] shrink-0 rounded border-slate-400 md:h-4 md:w-4"
                        />
                        Show password
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotOpen((prev) => !prev)
                          setForgotError("")
                          setForgotMessage("")
                          setForgotEmail(signinEmail.trim() || forgotEmail)
                          if (forgotOpen) {
                            setForgotOtpSent(false)
                            setForgotOtpVerified(false)
                            setForgotOtpCode("")
                            setForgotNewPassword("")
                            setForgotConfirmPassword("")
                            setShowForgotNewPassword(false)
                            setShowForgotConfirmPassword(false)
                          }
                        }}
                        className="touch-manipulation rounded-lg py-2 text-sm font-semibold text-slate-700 underline decoration-slate-400/80 underline-offset-[5px] active:bg-white/25 md:py-0 md:active:bg-transparent"
                      >
                        Forgot password?
                      </button>

                      {signinError ? <p className="-mt-1 text-sm text-rose-600">{signinError}</p> : null}
                    </>
                  )}
                </div>
              </div>

              {mode === "signin" && forgotOpen ? (
                <div className="px-4 pb-1 md:px-7">
                <div
                  className={cn(
                    "mt-2 rounded-2xl border p-4 max-md:shadow-[0_12px_36px_rgba(15,23,42,0.08)] md:mt-1 md:rounded-[22px]",
                    "border-white/40 bg-white/45 backdrop-blur-xl",
                    "md:border-slate-200 md:bg-white md:backdrop-blur-none",
                    "lg:border-white/26 lg:bg-white/18 lg:backdrop-blur-2xl lg:shadow-[0_2px_18px_rgba(15,23,42,0.04)]"
                  )}
                >
                  <p className="text-[15px] font-semibold text-slate-900 md:text-sm">Forgot password</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Enter your login email, verify OTP, then set a new password.</p>

                  <div className="mt-4 grid gap-3.5 md:gap-4">
                    <div>
                      <label htmlFor="forgot-email" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Email</label>
                      <input
                        id="forgot-email"
                        name="forgotEmail"
                        type="text"
                        placeholder="you@business.com"
                        value={forgotEmail}
                        onChange={(e) => handleTrackedInput("forgotEmail", setForgotEmail, e.target.value)}
                        className={landingAuthInputClass}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={sendForgotOtp}
                      disabled={forgotBusy || !forgotEmail.trim()}
                      className="inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition-[opacity,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-slate-800 hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 md:min-h-0 md:py-3 md:text-sm md:focus-visible:ring-4 md:focus-visible:ring-indigo-100 lg:min-h-[52px] lg:px-6 lg:py-3.5 lg:text-base lg:shadow-[0_2px_16px_rgba(15,23,42,0.11)]"
                    >
                      {forgotBusy ? "Processing..." : "Get OTP"}
                    </button>

                    <div>
                      <label htmlFor="forgot-otp" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">OTP</label>
                      <input
                        id="forgot-otp"
                        name="forgotOtpCode"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={forgotOtpCode}
                        onChange={(e) => handleTrackedInput("forgotOtpCode", setForgotOtpCode, e.target.value)}
                        disabled={!forgotOtpSent || forgotOtpVerified}
                        className={landingAuthInputDisabledClass}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={verifyForgotOtp}
                      disabled={!forgotOtpSent || forgotOtpVerified || forgotBusy || forgotOtpCode.trim().length < 6}
                      className="inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition-[opacity,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-slate-800 hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 md:min-h-0 md:py-3 md:text-sm md:focus-visible:ring-4 md:focus-visible:ring-indigo-100 lg:min-h-[52px] lg:px-6 lg:py-3.5 lg:text-base lg:shadow-[0_2px_16px_rgba(15,23,42,0.11)]"
                    >
                      {forgotBusy ? "Processing..." : forgotOtpVerified ? "OTP Verified" : "Verify OTP"}
                    </button>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label htmlFor="forgot-new-password" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">New password</label>
                        <input
                          id="forgot-new-password"
                          name="forgotNewPassword"
                          type={showForgotNewPassword ? "text" : "password"}
                          placeholder="New password"
                          value={forgotNewPassword}
                          onChange={(e) => handleTrackedInput("forgotNewPassword", setForgotNewPassword, e.target.value)}
                          disabled={!forgotOtpVerified}
                          className={landingAuthInputDisabledClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="forgot-confirm-password" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Confirm password</label>
                        <input
                          id="forgot-confirm-password"
                          name="forgotConfirmPassword"
                          type={showForgotConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={forgotConfirmPassword}
                          onChange={(e) => handleTrackedInput("forgotConfirmPassword", setForgotConfirmPassword, e.target.value)}
                          disabled={!forgotOtpVerified}
                          className={landingAuthInputDisabledClass}
                        />
                      </div>
                    </div>
                    <label className="inline-flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-3 rounded-xl py-1 text-sm text-slate-600 max-md:px-0.5 max-md:active:bg-white/25 md:min-h-0 md:gap-2 md:py-0">
                      <input
                        name="showForgotPasswords"
                        type="checkbox"
                        checked={showForgotNewPassword && showForgotConfirmPassword}
                        onChange={(e) => {
                          setShowForgotNewPassword(e.target.checked)
                          setShowForgotConfirmPassword(e.target.checked)
                        }}
                        className="h-[18px] w-[18px] shrink-0 rounded border-slate-400 md:h-4 md:w-4"
                        disabled={!forgotOtpVerified}
                      />
                      Show password
                    </label>

                    <p className="text-xs leading-5 text-slate-500">
                      Password rule: 7-20 chars with uppercase, lowercase, number, and special character.
                    </p>

                    <button
                      type="button"
                      onClick={updateForgotPassword}
                      disabled={!forgotOtpVerified || forgotBusy}
                      className="inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition-[opacity,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-slate-800 hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 md:min-h-0 md:py-3 md:text-sm md:focus-visible:ring-4 md:focus-visible:ring-indigo-100 lg:min-h-[52px] lg:px-6 lg:py-3.5 lg:text-base lg:shadow-[0_2px_16px_rgba(15,23,42,0.11)]"
                    >
                      {forgotBusy ? "Updating..." : "Update password"}
                    </button>

                    {forgotError ? <p className="text-sm text-rose-600">{forgotError}</p> : null}
                    {forgotMessage ? <p className="text-sm text-emerald-700">{forgotMessage}</p> : null}
                  </div>
                </div>
                </div>
              ) : null}

              {otpMode ? (
                <div className="px-4 pb-1 md:px-7">
                <div
                  className={cn(
                    "rounded-2xl border p-4 max-md:shadow-[0_12px_36px_rgba(15,23,42,0.08)] md:rounded-[22px]",
                    "border-white/40 bg-white/45 backdrop-blur-xl",
                    "md:border-slate-200 md:bg-white md:backdrop-blur-none",
                    "lg:border-white/26 lg:bg-white/18 lg:backdrop-blur-2xl lg:shadow-[0_2px_18px_rgba(15,23,42,0.04)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 md:gap-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold leading-snug text-slate-900 md:text-sm">Enter OTP code</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        We sent a code to <span className="font-semibold">{otpEmail}</span>. Paste it below to continue.
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <CreditCard className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="auth-otp" className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">OTP</label>
                    <input
                      id="auth-otp"
                      name="otpToken"
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter code"
                      value={otpToken}
                      onChange={(e) => handleTrackedInput("otpToken", setOtpToken, e.target.value)}
                      className={landingAuthInputClass}
                    />
                    {otpVerifyError ? <p className="mt-2 text-sm text-rose-600">{otpVerifyError}</p> : null}
                  </div>

                  <button
                    type="button"
                    onClick={verifyOtpNow}
                    disabled={otpBusy || otpToken.trim().length < 6}
                    className="mt-4 inline-flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition-[opacity,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-slate-800 hover:opacity-[0.96] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 md:min-h-0 md:py-3 md:text-sm md:focus-visible:ring-4 md:focus-visible:ring-indigo-100 lg:min-h-[52px] lg:px-6 lg:py-3.5 lg:text-base lg:shadow-[0_2px_16px_rgba(15,23,42,0.11)]"
                  >
                    {otpBusy ? "Verifying..." : "Verify & continue"}
                  </button>
                </div>
                </div>
              ) : null}

              <div
                className={cn(
                  "border-t px-4 py-4 md:px-7 md:py-6",
                  "border-white/25 bg-white/35 backdrop-blur-xl",
                  "md:border-slate-200 md:bg-slate-50/70 md:backdrop-blur-none",
                  "lg:border-white/25 lg:bg-white/10 lg:backdrop-blur-xl"
                )}
              >
                <div className="grid gap-3 max-md:gap-3.5">
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    disabled={primaryBusy || otpMode !== null || (mode === "create" && !createFormValid)}
                    className={cn(
                      "inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-[opacity,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 md:min-h-[48px] md:py-3 md:text-sm md:focus-visible:ring-4 md:focus-visible:ring-indigo-100 lg:min-h-[52px] lg:px-6 lg:py-3.5 lg:text-base",
                      primaryBusy || (mode === "create" && !createFormValid)
                        ? "min-h-[52px] bg-slate-200/90 text-slate-500 md:min-h-[48px]"
                        : "min-h-[52px] bg-slate-950 text-white shadow-[0_18px_44px_rgba(15,23,42,0.2)] hover:bg-slate-800 hover:opacity-[0.96] active:scale-[0.99] md:min-h-[48px] lg:shadow-[0_2px_16px_rgba(15,23,42,0.11)]"
                    )}
                  >
                    {primaryBusy ? (mode === "create" ? "Creating account..." : "Signing in...") : panelCopy.primary}
                    <ArrowRight className="h-[18px] w-[18px] shrink-0 md:h-4 md:w-4 lg:h-[1.125rem] lg:w-[1.125rem]" />
                  </button>

                  <div
                    className={cn(
                      "rounded-2xl border px-4 py-3.5 text-sm leading-relaxed text-slate-600 transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] max-md:active:opacity-90 md:rounded-[22px] md:py-3",
                      "border-white/40 bg-white/50 backdrop-blur-md",
                      "md:border-slate-200 md:bg-white md:backdrop-blur-none md:hover:opacity-90",
                      "lg:border-white/25 lg:bg-white/20 lg:backdrop-blur-md lg:shadow-[0_2px_14px_rgba(15,23,42,0.035)]"
                    )}
                  >
                    {panelCopy.secondary}{" "}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === "signin" ? "create" : "signin")}
                      className="touch-manipulation font-semibold text-slate-950 underline decoration-slate-400/80 underline-offset-[5px]"
                    >
                      {panelCopy.switchLabel}
                    </button>
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl border p-4 transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] max-md:active:opacity-95 md:rounded-[22px] md:hover:opacity-90",
                      "border-white/40 bg-white/45 backdrop-blur-md",
                      "md:border-slate-200 md:bg-white md:backdrop-blur-none",
                      "lg:border-white/25 lg:bg-white/18 lg:backdrop-blur-2xl lg:shadow-[0_2px_18px_rgba(15,23,42,0.04)]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <Stars className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Resume-friendly</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          If you leave during setup, we&apos;ll continue from the last step next time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 hidden gap-4 lg:grid lg:grid-cols-3">
                {authStories.map(({ eyebrow, title, description, chip, icon: Icon }, index) => (
                  <div
                    key={title}
                    className="auth-glass-desktop-inset rounded-[28px] border border-white/22 bg-white/18 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] bg-white/80 text-slate-900 shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{eyebrow}</p>
                          <span className="rounded-full border border-white/30 bg-white/34 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                            0{index + 1}
                          </span>
                        </div>
                        <h3 className="mt-3 text-[1.75rem] font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950">
                          {title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
                        <div className="mt-5 inline-flex rounded-full border border-white/35 bg-white/35 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 backdrop-blur-md">
                          {chip}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
