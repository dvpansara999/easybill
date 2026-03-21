"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import InvoiceAnimeBackground from "@/components/backgrounds/InvoiceAnimeBackground"
import EasyBillLogoMark from "@/components/brand/EasyBillLogoMark"
import { signIn, signInWithOtp, signInWithProvider, signOut, signUp, updatePasswordAfterOtp, verifyEmailOtp } from "@/lib/auth"
import { runSeedAndScopeMigration } from "@/lib/seedDataMigration"
import { emptySetupProfileDraft, saveSetupProfileDraft } from "@/lib/setupProfileDraft"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  FileText,
  LockKeyhole,
  Sparkles,
  Stars,
  Wand2,
} from "lucide-react"

const MemoInvoiceAnimeBackground = memo(InvoiceAnimeBackground)

const MARKETING_FEATURES = [
  {
    title: "Go digital (save paper)",
    desc: "Create, share, and store invoices digitally—cleaner for your desk and lighter on paper.",
    icon: BadgeCheck,
    tone: "emerald" as const,
  },
  {
    title: "100+ templates + PDF export",
    desc: "Pick from 100+ designs and export A4 PDFs that look professional when shared or printed.",
    icon: FileText,
    tone: "indigo" as const,
  },
  {
    title: "Move faster with saved items",
    desc: "Reuse saved products and customers to build invoices in seconds—no re-typing.",
    icon: Sparkles,
    tone: "sky" as const,
  },
  {
    title: "End-to-end encrypted",
    desc: "Sensitive fields are protected with end-to-end encryption and secure storage handling.",
    icon: LockKeyhole,
    tone: "rose" as const,
  },
]

const WHY_EASIER_POINTS = [
  "No ads. No distractions.",
  "Unlimited invoices with Plus.",
  "Edit invoices on Plus if you made a mistake.",
  "Clean UI made for daily billing work.",
]

const MarketingPanel = memo(function MarketingPanel() {
  return (
    <section className="order-2 space-y-7 lg:order-1">
      <div className="rounded-[28px] border border-slate-200 bg-white/70 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur sm:rounded-[34px] sm:p-7">
        <div className="flex items-center gap-4">
          <EasyBillLogoMark size={56} className="drop-shadow sm:hidden" />
          <EasyBillLogoMark size={68} className="hidden drop-shadow sm:block" />
          <div>
            <p className="text-sm font-extrabold tracking-tight text-slate-950">easyBILL</p>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Create • Send • Track</p>
          </div>
        </div>

        <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm">
          <Wand2 className="h-4 w-4" />
          Built for first-time users
        </div>

        <h1 className="font-display mt-5 text-4xl leading-[1.06] text-slate-950 sm:mt-6 sm:text-6xl sm:leading-[1.02]">
          Professional invoices, made easy.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:mt-4 sm:text-base">
          easyBILL gives you a calm workspace with smart defaults—so you can bill faster, look professional, and stay
          organized.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MARKETING_FEATURES.map((item) => {
          const Icon = item.icon
          const tone = item.tone
          const toneClasses =
            tone === "indigo"
              ? "bg-indigo-50 text-indigo-700"
              : tone === "emerald"
                ? "bg-emerald-50 text-emerald-700"
                : tone === "sky"
                  ? "bg-sky-50 text-sky-700"
                  : "bg-rose-50 text-rose-700"

          return (
            <div
              key={item.title}
              className="rounded-[24px] border border-slate-200 bg-white/75 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)] backdrop-blur sm:rounded-[28px] sm:p-5"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClasses} sm:h-11 sm:w-11`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white/70 p-5 text-left shadow-sm backdrop-blur sm:rounded-[30px] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Why it feels easier</p>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          {WHY_EASIER_POINTS.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(to_bottom,_#fafaf9,_#f1f5f9)] px-4 py-6 sm:py-8 lg:px-8">
      <MemoInvoiceAnimeBackground />

      <div className="relative mx-auto w-full max-w-[1180px]">
        <div className="h-2 sm:h-4" />

        <div className="mt-6 grid gap-6 sm:gap-8 lg:mt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* LEFT: brand + pros */}
          <MarketingPanel />

          {/* RIGHT: auth card (mechanics unchanged) */}
          <section className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 text-left shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur sm:rounded-[34px]">
              <div className="border-b border-slate-200 bg-white/60 px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-700">{panelCopy.eyebrow}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{panelCopy.description}</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 text-sm">
                    <button
                      onClick={() => switchMode("signin")}
                      className={`rounded-full px-3.5 py-2 font-semibold transition ${
                        mode === "signin" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => switchMode("create")}
                      className={`rounded-full px-3.5 py-2 font-semibold transition ${
                        mode === "create" ? "bg-slate-950 text-white" : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      Create account
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-6 sm:px-7 sm:py-7">
                <div className="grid gap-4">
                  <div className="mx-auto grid w-full max-w-sm gap-3">
                    <button
                      type="button"
                      onClick={() => startOAuth("google")}
                      disabled={oauthBusy}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
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

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">or</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  {mode === "create" ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">Business name</label>
                        <input
                          type="text"
                          placeholder="e.g. ABC Traders"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                        {showError(createErrors.businessName, businessName) && (
                          <p className="mt-2 text-sm text-rose-600">{createErrors.businessName}</p>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">Email</label>
                        <input
                          type="email"
                          placeholder="you@business.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                        {showError(createErrors.email, email) && (
                          <p className="mt-2 text-sm text-rose-600">{createErrors.email}</p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-900">Create password</label>
                          <input
                            type={showCreatePassword ? "text" : "password"}
                            placeholder="7–20 characters"
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                          />
                          {showError(createErrors.createPassword, createPassword) && (
                            <p className="mt-2 text-sm text-rose-600">{createErrors.createPassword}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-900">Confirm password</label>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                          />
                          {showError(createErrors.confirmPassword, confirmPassword) && (
                            <p className="mt-2 text-sm text-rose-600">{createErrors.confirmPassword}</p>
                          )}
                        </div>
                      </div>

                      <label className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={showCreatePassword && showConfirmPassword}
                          onChange={(e) => {
                            setShowCreatePassword(e.target.checked)
                            setShowConfirmPassword(e.target.checked)
                          }}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Show password
                      </label>

                      <label className="inline-flex items-start gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <span>
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
                        <label className="mb-2 block text-sm font-semibold text-slate-900">Email</label>
                        <input
                          type="text"
                          placeholder="you@business.com"
                          value={signinEmail}
                          onChange={(e) => setSigninEmail(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">Password</label>
                        <input
                          type={showSigninPassword ? "text" : "password"}
                          placeholder="Your password"
                          value={signinPassword}
                          onChange={(e) => setSigninPassword(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                      </div>

                      <label className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={showSigninPassword}
                          onChange={(e) => setShowSigninPassword(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300"
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
                        className="w-fit text-sm font-semibold text-slate-700 underline underline-offset-4"
                      >
                        Forgot password?
                      </button>

                      {signinError ? <p className="-mt-1 text-sm text-rose-600">{signinError}</p> : null}
                    </>
                  )}
                </div>
              </div>

              {mode === "signin" && forgotOpen ? (
                <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Forgot password</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Enter your login email, verify OTP, then set a new password.</p>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-900">Email</label>
                      <input
                        type="text"
                        placeholder="you@business.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={sendForgotOtp}
                      disabled={forgotBusy || !forgotEmail.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                      {forgotBusy ? "Processing..." : "Get OTP"}
                    </button>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-900">OTP</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={forgotOtpCode}
                        onChange={(e) => setForgotOtpCode(e.target.value)}
                        disabled={!forgotOtpSent || forgotOtpVerified}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={verifyForgotOtp}
                      disabled={!forgotOtpSent || forgotOtpVerified || forgotBusy || forgotOtpCode.trim().length < 6}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                      {forgotBusy ? "Processing..." : forgotOtpVerified ? "OTP Verified" : "Verify OTP"}
                    </button>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">New password</label>
                        <input
                          type={showForgotNewPassword ? "text" : "password"}
                          placeholder="New password"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          disabled={!forgotOtpVerified}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-900">Confirm password</label>
                        <input
                          type={showForgotConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          disabled={!forgotOtpVerified}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={showForgotNewPassword && showForgotConfirmPassword}
                        onChange={(e) => {
                          setShowForgotNewPassword(e.target.checked)
                          setShowForgotConfirmPassword(e.target.checked)
                        }}
                        className="h-4 w-4 rounded border-slate-300"
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    >
                      {forgotBusy ? "Updating..." : "Update password"}
                    </button>

                    {forgotError ? <p className="text-sm text-rose-600">{forgotError}</p> : null}
                    {forgotMessage ? <p className="text-sm text-emerald-700">{forgotMessage}</p> : null}
                  </div>
                </div>
              ) : null}

              {otpMode ? (
                <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">Enter OTP code</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        We sent a code to <span className="font-semibold">{otpEmail}</span>. Paste it below to continue.
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <CreditCard className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-900">OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter code"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    />
                    {otpVerifyError ? <p className="mt-2 text-sm text-rose-600">{otpVerifyError}</p> : null}
                  </div>

                  <button
                    type="button"
                    onClick={verifyOtpNow}
                    disabled={otpBusy || otpToken.trim().length < 6}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                  >
                    {otpBusy ? "Verifying..." : "Verify & continue"}
                  </button>
                </div>
              ) : null}

              <div className="border-t border-slate-200 bg-slate-50/70 px-7 py-6">
                <div className="grid gap-3">
                  <button
                    onClick={handlePrimaryAction}
                    disabled={primaryBusy || otpMode !== null || (mode === "create" && !createFormValid)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 ${
                      primaryBusy || (mode === "create" && !createFormValid)
                        ? "bg-slate-200 text-slate-500"
                        : "bg-slate-950 text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] hover:bg-slate-800"
                    }`}
                  >
                    {primaryBusy ? (mode === "create" ? "Creating account..." : "Signing in...") : panelCopy.primary}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    {panelCopy.secondary}{" "}
                    <button
                      onClick={() => switchMode(mode === "signin" ? "create" : "signin")}
                      className="font-semibold text-slate-950 underline underline-offset-4"
                    >
                      {panelCopy.switchLabel}
                    </button>
                  </div>

                  <div className="rounded-[22px] border border-slate-200 bg-white p-4">
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
