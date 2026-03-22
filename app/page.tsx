"use client"

import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Inter } from "next/font/google"
import { useRouter } from "next/navigation"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import LandingInvoicePreview from "@/components/templatePreview/LandingInvoicePreview"
import { signIn, signInWithOtp, signInWithProvider, signOut, signUp, updatePasswordAfterOtp, verifyEmailOtp } from "@/lib/auth"
import { runSeedAndScopeMigration } from "@/lib/seedDataMigration"
import { emptySetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
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
    desc: "Create, share, and store invoices digitally—less paper on your desk.",
    icon: BadgeCheck,
  },
  {
    title: "100+ templates",
    desc: "Modern, minimal, and classic layouts—pick what fits your brand.",
    icon: LayoutTemplate,
  },
  {
    title: "A4 PDF export",
    desc: "Print-ready PDFs that look professional every time.",
    icon: FileText,
  },
  {
    title: "Saved catalog",
    desc: "Reuse products and customers—build invoices in seconds.",
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
    desc: "A calm UI with smart defaults—built for daily billing.",
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
    desc: "Export PDFs in one tap—ready to send or print.",
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

const LandingStack = memo(function LandingStack({
  onLoginClick,
  onSignUpClick,
}: {
  onLoginClick: () => void
  onSignUpClick: () => void
}) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10 lg:gap-12">
      {/* Top: logo + Log in */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <EasyBillLogoMark size={48} className="shrink-0 drop-shadow sm:hidden" />
          <EasyBillLogoMark size={54} className="hidden shrink-0 drop-shadow sm:block" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">easyBILL</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 sm:text-xs">Create • Send • Track</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLoginClick}
          className="shrink-0 touch-manipulation rounded-full border border-white/45 bg-white/55 px-4 py-2.5 text-[13px] font-semibold text-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md transition-[opacity,background-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-200/90 md:border-slate-200/80 md:bg-white/90 md:px-6 md:py-3 md:text-[15px] md:shadow-sm md:backdrop-blur-none md:focus-visible:ring-4 md:focus-visible:ring-indigo-100 lg:border-white/48 lg:bg-white/14 lg:shadow-[0_12px_40px_rgba(15,23,42,0.08)] lg:backdrop-blur-xl"
        >
          Log in
        </button>
      </header>

      {/* Big heading */}
      <div className="text-center">
        <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 !font-[family-name:var(--font-auth-inter),sans-serif] sm:text-5xl sm:leading-[1.06] lg:text-6xl lg:leading-[1.05] xl:text-[4.25rem] xl:leading-[1.02]">
          Professional invoices, made easy.
        </h1>
        <p className="mx-auto mt-4 inline-flex max-w-xl items-center justify-center gap-2 text-sm font-medium text-slate-600 sm:text-[15px]">
          <Users className="h-4 w-4 shrink-0 text-indigo-700" aria-hidden />
          <span>Used by 500+ businesses</span>
        </p>
        <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-7 text-slate-600 sm:text-[15px] sm:leading-8">
          Calm defaults, clean PDFs, and a workspace that stays out of your way—bill faster and look professional.
        </p>
      </div>

      {/* Big invoice preview — real app template */}
      <div className="auth-glass-desktop w-full rounded-[1.25rem] p-1.5 shadow-[0_16px_48px_rgba(15,23,42,0.08)] ring-1 ring-white/20 md:rounded-[2rem] md:p-3 md:shadow-none md:ring-0 lg:rounded-[2.25rem] lg:p-4">
        <LandingInvoicePreview />
      </div>

      {/* Feature grid — dense tiles; auto-fill spans full row width */}
      <div className="w-full">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 sm:mb-4 sm:text-left">
          Everything in easyBILL
        </p>
        <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] gap-2 sm:min-w-0 sm:grid-cols-[repeat(auto-fill,minmax(7.25rem,1fr))] sm:gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(7.75rem,1fr))] lg:gap-3">
          {LANDING_FEATURES.map((item, index) => {
            const Icon = item.icon
            const tone = LANDING_FEATURE_TONES[index % LANDING_FEATURE_TONES.length]
            const toneClasses =
              tone === "indigo"
                ? "bg-indigo-500/20 text-indigo-800"
                : tone === "emerald"
                  ? "bg-emerald-500/20 text-emerald-800"
                  : tone === "sky"
                    ? "bg-sky-500/20 text-sky-800"
                    : "bg-rose-500/20 text-rose-800"

            return (
              <div
                key={item.title}
                title={item.desc}
                className="auth-glass-tile flex min-h-[5.75rem] flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center transition-opacity duration-200 ease-out hover:opacity-92 sm:min-h-[6.25rem] sm:rounded-2xl sm:px-2.5 sm:py-3"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${toneClasses}`}>
                  <Icon className="h-4 w-4 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden />
                </div>
                <p className="text-[10px] font-semibold leading-tight text-slate-950 sm:text-[11px]">{item.title}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sign up CTA */}
      <div className="flex flex-col items-center gap-3 pb-2">
        <button
          type="button"
          onClick={onSignUpClick}
          className="inline-flex min-h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-slate-950 px-8 py-3.5 text-base font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.2)] transition-opacity duration-200 ease-out hover:bg-slate-800 hover:opacity-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:min-h-14 sm:text-lg lg:shadow-[0_2px_20px_rgba(15,23,42,0.14)]"
        >
          Sign up free
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="text-center text-xs text-slate-500">No credit card required to start.</p>
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
        "Jump into your dashboard and continue where you left off — invoices, customers, templates, and settings.",
      primary: "Sign In",
      secondary: "Need a new workspace?",
      switchLabel: "Create Account",
    }
  }, [mode])

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
    const start = performance.now()
    setter(next)
    window.requestAnimationFrame(() => {
      const elapsed = performance.now() - start
      if (elapsed >= 24) {
        console.info(`[auth-lag] ${field}: ${elapsed.toFixed(1)}ms`)
      }
    })
  }

  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return
    if (!window.matchMedia("(max-width: 1023px)").matches) return
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= 50) {
          console.warn(`[auth-lag] long-task: ${entry.duration.toFixed(1)}ms`)
        }
      }
    })
    try {
      observer.observe({ entryTypes: ["longtask"] })
    } catch {
      // ignore unsupported environments
    }
    return () => observer.disconnect()
  }, [])

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
        const supabase = createSupabaseBrowserClient()
        const { data } = await supabase.auth.getUser()
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
        const supabase = createSupabaseBrowserClient()
        const { data } = await supabase.auth.getUser()
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
      // No authenticated session exists yet, so this is stored globally and later synced to user_kv.
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

    // After sign-in, check onboarding completion.
    // If they haven't completed setup (no businessProfile), send them to Step 1.
    const navigate = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: me } = await supabase.auth.getUser()
      const userId = me.user?.id
      if (!userId) {
        router.push("/dashboard")
        return
      }

      const { data: setupRows } = await supabase
        .from("user_kv")
        .select("key,value")
        .eq("user_id", userId)
        .in("key", ["businessProfile", "accountSetupBundle"])

      const rows = (setupRows ?? []) as Array<{ key: string; value: unknown }>
      const legacyProfile = rows.find((r) => r.key === "businessProfile")?.value
      const bundledRaw = rows.find((r) => r.key === "accountSetupBundle")?.value
      let bundledProfile: unknown = null
      if (bundledRaw && typeof bundledRaw === "object") {
        bundledProfile = (bundledRaw as Record<string, unknown>).businessProfile
      } else if (typeof bundledRaw === "string") {
        try {
          const parsed = JSON.parse(bundledRaw) as Record<string, unknown>
          bundledProfile = parsed.businessProfile
        } catch {
          bundledProfile = null
        }
      }
      const hasBusinessProfile = Boolean(legacyProfile || bundledProfile)

      if (!hasBusinessProfile) {
        // Prepare Step-1 locally (email locked, business name blank until user edits).
        const { setActiveOrGlobalItem } = await import("@/lib/userStore")
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

    // Wait briefly so auth session + any KV hydration has settled.
    const onCloud = () => {
      window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
      void navigate()
    }
    window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
    window.setTimeout(() => {
      window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
      void navigate()
    }, 2500)
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

    async function navigate() {
      const { getActiveOrGlobalItem } = await import("@/lib/userStore")
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

    // Wait for cloud KV hydration (so getActiveOrGlobalItem reads correct scoped values).
    const onCloud = () => {
      window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
      void navigate()
    }
    window.addEventListener("easybill:cloud-sync", onCloud as EventListener)
    window.setTimeout(() => {
      window.removeEventListener("easybill:cloud-sync", onCloud as EventListener)
      void navigate()
    }, 2500)
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
      className={`${inter.variable} relative min-h-screen overflow-hidden bg-[linear-gradient(155deg,#eef2fb_0%,#e4eaf7_28%,#eef1fb_55%,#e2e8f8_100%)] px-3.5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] [font-family:var(--font-auth-inter),ui-sans-serif,system-ui,sans-serif] sm:px-4 sm:py-8 lg:px-8 lg:py-10 lg:pb-10`}
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
            <div
              className={cn(
                "auth-glass-desktop mx-auto w-full max-w-[540px] overflow-hidden text-left",
                /* Phone-first: frosted sheet like desktop */
                "rounded-[1.35rem] border border-white/45 !bg-white/[0.52] shadow-[0_24px_64px_rgba(15,23,42,0.12)] ring-1 ring-white/25 backdrop-blur-2xl",
                "md:rounded-[34px] md:border-slate-200/90 md:!bg-white/80 md:shadow-[0_30px_90px_rgba(15,23,42,0.10)] md:ring-0 md:backdrop-blur-md",
                "lg:rounded-[2rem] lg:border-white/28"
              )}
            >
              <div
                className={cn(
                  "border-b px-4 py-4 md:px-7 md:py-6",
                  "border-white/25 bg-white/30 backdrop-blur-xl",
                  "md:border-slate-200 md:bg-white/60 md:backdrop-blur-none",
                  "lg:border-white/28 lg:bg-white/12 lg:backdrop-blur-xl"
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-700 md:text-xs md:tracking-[0.32em]">
                      {panelCopy.eyebrow}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600 md:mt-2 md:text-sm md:leading-6">{panelCopy.description}</p>
                  </div>

                  <div
                    className={cn(
                      "grid w-full shrink-0 grid-cols-2 gap-1 rounded-2xl border p-1 text-[15px] font-semibold leading-none md:w-auto md:max-w-none md:gap-2 md:rounded-full md:p-1 md:text-sm",
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

              <div className="px-4 py-5 md:px-7 md:py-7">
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
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Business name</label>
                        <input
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
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Email</label>
                        <input
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
                          <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Create password</label>
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            placeholder="7–20 characters"
                            value={createPassword}
                            onChange={(e) => handleTrackedInput("createPassword", setCreatePassword, e.target.value)}
                            className={landingAuthInputClass}
                          />
                          {showError(createErrors.createPassword, createPassword) && (
                            <p className="mt-2 text-sm text-rose-600">{createErrors.createPassword}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Confirm password</label>
                          <input
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
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Email</label>
                        <input
                          type="text"
                          placeholder="you@business.com"
                          value={signinEmail}
                          onChange={(e) => handleTrackedInput("signinEmail", setSigninEmail, e.target.value)}
                          className={landingAuthInputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Password</label>
                        <input
                          type={showSigninPassword ? "text" : "password"}
                          placeholder="Your password"
                          value={signinPassword}
                          onChange={(e) => handleTrackedInput("signinPassword", setSigninPassword, e.target.value)}
                          className={landingAuthInputClass}
                        />
                      </div>

                      <label className="mt-1 inline-flex min-h-[44px] cursor-pointer touch-manipulation items-center gap-3 rounded-xl py-1 text-sm text-slate-600 max-md:px-0.5 max-md:active:bg-white/30 md:min-h-0 md:gap-2 md:py-0">
                        <input
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
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Email</label>
                      <input
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
                      <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">OTP</label>
                      <input
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
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">New password</label>
                        <input
                          type={showForgotNewPassword ? "text" : "password"}
                          placeholder="New password"
                          value={forgotNewPassword}
                          onChange={(e) => handleTrackedInput("forgotNewPassword", setForgotNewPassword, e.target.value)}
                          disabled={!forgotOtpVerified}
                          className={landingAuthInputDisabledClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">Confirm password</label>
                        <input
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
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-900 md:mb-2 md:text-sm">OTP</label>
                    <input
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
                          If you leave during setup, we’ll continue from the last step next time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
