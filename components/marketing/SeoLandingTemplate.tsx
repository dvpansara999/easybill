import Link from "next/link"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import type { SeoIconName, SeoLandingContent } from "@/lib/marketing/seoPageTypes"
import {
  Banknote,
  BarChart3,
  CheckCircle2,
  CircleHelp,
  Clock,
  Download,
  FilePenLine,
  FileText,
  Layers,
  Package,
  Palette,
  Receipt,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  Zap,
  Cloud,
  type LucideIcon,
} from "lucide-react"

const SEO_ICON_MAP: Record<SeoIconName, LucideIcon> = {
  Receipt,
  FileText,
  Zap,
  Download,
  Shield,
  Layers,
  Smartphone,
  Banknote,
  Palette,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  Sparkles,
  FilePenLine,
  Share2,
  Cloud,
  Package,
}

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
] as const

const FOOTER_PRODUCT = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gst-invoice-generator", label: "GST invoice" },
  { href: "/free-invoice-generator", label: "Free generator" },
  { href: "/invoice-generator-india", label: "India" },
  { href: "/invoice-customization", label: "Customization" },
  { href: "/invoice-templates", label: "Templates" },
  { href: "/create-invoice-online", label: "Create online" },
  { href: "/download-invoice-pdf", label: "PDF download" },
  { href: "/billing-software-for-small-business", label: "Small business" },
] as const

const SECTION_SHELL = "mx-auto max-w-6xl px-4 sm:px-6"

export default function SeoLandingTemplate({
  content,
  activePath,
}: {
  content: SeoLandingContent
  activePath: string
}) {
  return (
    <div className="text-slate-900">
      <MarketingHeader activePath={activePath} />

      <main>
        {/* Hero */}
        <section className={`${SECTION_SHELL} border-b border-slate-200/50 pb-12 pt-8 text-center sm:pb-14 sm:pt-10`}>
          {content.heroEyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700/90">{content.heroEyebrow}</p>
          ) : null}
          <h1 className="mx-auto mt-3 max-w-3xl text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            {content.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-indigo-600 px-8 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-indigo-700 active:scale-[0.98]"
            >
              Start free
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-slate-200/90 bg-white/80 px-6 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition-[background-color,border-color] duration-200 hover:border-slate-300 hover:bg-white"
            >
              Log in
            </Link>
          </div>
        </section>

        {/* Problem + Solution — side by side on large screens */}
        <section className="border-t border-slate-200/60 bg-gradient-to-b from-slate-50/90 to-white/60 py-12 sm:py-16 lg:py-20">
          <div className={SECTION_SHELL}>
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-20 lg:items-start">
              {/* Challenges */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600/90">The challenge</p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-snug text-slate-950 sm:text-3xl">
                  {content.problemTitle}
                </h2>
                <ul className="mt-6 space-y-3 sm:space-y-4">
                  {content.problems.map((p, i) => (
                    <li
                      key={p.title}
                      className="flex gap-3 rounded-xl border border-rose-200/50 bg-white/90 p-4 shadow-sm sm:gap-4 sm:p-5"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-xs font-bold text-rose-800"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <h3 className="text-sm font-semibold leading-snug text-slate-900 sm:text-[15px]">{p.title}</h3>
                        <p className="mt-1.5 text-sm leading-snug text-slate-600">{p.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solution */}
              <div className="rounded-2xl border border-emerald-200/40 bg-emerald-50/35 p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700/90">Our answer</p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-snug text-slate-950 sm:text-[1.65rem]">
                  {content.solutionTitle}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-[15px]">{content.solutionLead}</p>
                <ul className="mt-6 space-y-2.5 border-t border-emerald-200/50 pt-5">
                  {content.solutionPoints.map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm leading-snug text-slate-800 sm:text-[15px]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200/60 bg-white/50 py-12 sm:py-16 lg:py-20">
          <div className={SECTION_SHELL}>
            <h2 className="max-w-2xl font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
              {content.featuresSectionTitle}
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
              {content.features.map((f) => {
                const Icon = SEO_ICON_MAP[f.icon]
                return (
                  <div
                    key={f.title}
                    className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-800">
                      <Icon className="h-[1.15rem] w-[1.15rem]" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-slate-900">{f.title}</h3>
                      <p className="mt-1 text-sm leading-snug text-slate-600">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How it works — three columns on desktop */}
        <section className="border-t border-slate-200/60 py-12 sm:py-16 lg:py-20">
          <div className={SECTION_SHELL}>
            <h2 className="font-display text-2xl font-semibold text-slate-950 sm:text-3xl">{content.howItWorksTitle}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-5">
              {content.steps.map((step, i) => (
                <div
                  key={step.title}
                  className="relative rounded-2xl border border-slate-200/80 bg-white px-5 pb-6 pt-9 text-center shadow-sm"
                >
                  <span
                    className="absolute left-1/2 top-0 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-[15px] font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-snug text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — two columns, short bullet answers */}
        <section className="border-t border-slate-200/60 bg-slate-50/80 py-12 sm:py-16 lg:py-20">
          <div className={SECTION_SHELL}>
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600/90">Quick answers</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">{content.faqTitle}</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
              {content.faqs.map((item) => (
                <article
                  key={item.q}
                  className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
                >
                  <h3 className="flex gap-3 text-left text-[15px] font-semibold leading-snug text-slate-900">
                    <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" aria-hidden />
                    <span>{item.q}</span>
                  </h3>
                  <ul className="mt-4 list-disc space-y-1.5 border-l-2 border-indigo-100 pl-4 marker:text-indigo-400 sm:pl-5" role="list">
                    {item.points.map((pt) => (
                      <li key={pt} className="pl-1 text-sm leading-snug text-slate-600">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-16 pt-4 sm:pb-20">
          <div className={SECTION_SHELL}>
            <div className="rounded-[1.75rem] border border-indigo-200/60 bg-gradient-to-br from-indigo-600/95 to-indigo-800 px-6 py-10 text-center text-white shadow-lg sm:px-10 sm:py-12">
              <h2 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{content.ctaTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-indigo-100 sm:text-base">{content.ctaSubtitle}</p>
              <Link
                href="/"
                className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-indigo-800 shadow-md transition-[transform,background-color] duration-200 hover:bg-indigo-50 active:scale-[0.98]"
              >
                Start free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

function MarketingHeader({ activePath }: { activePath: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/50 bg-[rgba(255,255,255,0.78)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <EasyBillLogoMark size={40} className="shrink-0 sm:hidden" />
          <EasyBillLogoMark size={44} className="hidden shrink-0 sm:block" />
          <div className="min-w-0 text-left">
            <p className="text-sm font-extrabold tracking-tight text-slate-950">easyBILL</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">
              Create • Send • Track
            </p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Marketing">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                activePath === item.href
                  ? "rounded-full bg-slate-900/5 px-3 py-2 text-sm font-semibold text-slate-900"
                  : "rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:px-5"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  )
}

function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/50 py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <EasyBillLogoMark size={36} />
              <span className="font-display text-lg font-semibold text-slate-900">easyBILL</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              Professional invoices for Indian businesses—templates, GST-ready lines, and PDFs in one calm workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
              <ul className="mt-3 space-y-2">
                {FOOTER_PRODUCT.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate-600 hover:text-slate-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-slate-600 hover:text-slate-900">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
                    Home
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-slate-500 sm:text-left">
          © {new Date().getFullYear()} easyBILL. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
