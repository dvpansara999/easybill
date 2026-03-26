"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, ClipboardList, Send, TriangleAlert } from "lucide-react"
import { getActiveAuthRecord } from "@/lib/auth"
import { getSupabaseUser } from "@/lib/supabase/browser"

function readInitialAccountState() {
  const auth = getActiveAuthRecord()

  return {
    accountEmail: auth?.email || "",
    accountUserId: auth?.userId || "",
  }
}

export default function ReportBugFeedbackPage() {
  const router = useRouter()
  const initialAccountState = readInitialAccountState()
  const [accountEmail, setAccountEmail] = useState(initialAccountState.accountEmail)
  const [accountUserId] = useState(initialAccountState.accountUserId)
  const [reportSubject, setReportSubject] = useState("")
  const [reportSeverity, setReportSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [reportWhatHappened, setReportWhatHappened] = useState("")
  const [reportExpected, setReportExpected] = useState("")
  const [reportSteps, setReportSteps] = useState("")
  const [reportMessage, setReportMessage] = useState("")
  const [reportError, setReportError] = useState("")
  const [sendingReport, setSendingReport] = useState(false)
  const [copyingReport, setCopyingReport] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await getSupabaseUser()
        if (data.user?.email) setAccountEmail(data.user.email)
      } catch {
        // ignore
      }
    })()
  }, [])

  const inputStyle =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"

  function buildPayload() {
    const now = new Date().toISOString()
    const page = typeof window !== "undefined" ? window.location.href : ""
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
    return {
      app: "easyBILL",
      reportType: "bug_or_feedback",
      timestamp: now,
      account: {
        userId: accountUserId || "unknown",
        email: accountEmail || "unknown",
      },
      severity: reportSeverity,
      subject: reportSubject.trim(),
      whatHappened: reportWhatHappened.trim(),
      expected: reportExpected.trim(),
      stepsToReproduce: reportSteps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      environment: {
        page,
        userAgent: ua,
      },
    }
  }

  async function sendReport() {
    setReportError("")
    setReportMessage("")

    if (!reportSubject.trim()) {
      setReportError("Please add a short title.")
      return
    }
    if (!reportWhatHappened.trim()) {
      setReportError("Please describe what happened.")
      return
    }
    if (!reportSteps.trim()) {
      setReportError("Please add reproduction steps.")
      return
    }

    setSendingReport(true)
    try {
      const payload = buildPayload()
      const reportText = JSON.stringify(payload, null, 2)
      const inboxEmail = "useeasybill@gmail.com"
      const rawSubject = `[Report][${reportSeverity.toUpperCase()}] ${reportSubject.trim()}`
      const rawBody =
        `Please review this bug/feedback report:\n\n${reportText}\n\n---\nSent from easyBILL settings report form.`
      const subject = encodeURIComponent(rawSubject)
      const body = encodeURIComponent(rawBody)

      if (typeof window !== "undefined") {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inboxEmail)}&su=${subject}&body=${body}`
        const popup = window.open(gmailUrl, "_blank", "noopener,noreferrer")
        if (!popup) {
          window.open(`mailto:${inboxEmail}?subject=${subject}&body=${body}`, "_blank")
        }
      }
      setReportMessage("Report draft prepared. Gmail compose opened in a new tab.")
    } finally {
      setSendingReport(false)
    }
  }

  async function copyReport() {
    setReportError("")
    setReportMessage("")
    if (!reportSubject.trim() || !reportWhatHappened.trim() || !reportSteps.trim()) {
      setReportError("Please fill title, details, and steps first.")
      return
    }
    setCopyingReport(true)
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildPayload(), null, 2))
      setReportMessage("Full report copied to clipboard.")
    } catch {
      setReportError("Unable to copy right now. Please try again.")
    } finally {
      setCopyingReport(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 lg:space-y-8 lg:pb-0">
      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-fit sm:justify-start sm:rounded-full sm:py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-emerald-700">Settings</p>
          <h1 className="font-display mt-3 text-3xl text-slate-950 sm:text-4xl">Report bug and feedback</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Share issues and ideas with full context so fixes and improvements can be shipped faster.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="section-title text-2xl">Report details</h2>
              <p className="mt-1 text-sm text-slate-500">This report includes account and environment context automatically.</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
              Account: <span className="font-mono">{accountUserId || "-"}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Title</p>
              <input
                value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)}
                placeholder="Short title (e.g. Invoice total not updating)"
                className={inputStyle}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Severity</p>
              <select
                value={reportSeverity}
                onChange={(e) => setReportSeverity(e.target.value as "low" | "medium" | "high" | "critical")}
                className={inputStyle}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-900">What happened</p>
              <textarea
                value={reportWhatHappened}
                onChange={(e) => setReportWhatHappened(e.target.value)}
                placeholder="Describe the issue or feedback."
                className={`${inputStyle} min-h-[100px]`}
              />
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-900">What you expected</p>
              <textarea
                value={reportExpected}
                onChange={(e) => setReportExpected(e.target.value)}
                placeholder="Describe expected behavior."
                className={`${inputStyle} min-h-[90px]`}
              />
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-900">Steps to reproduce</p>
              <textarea
                value={reportSteps}
                onChange={(e) => setReportSteps(e.target.value)}
                placeholder={"1) Go to ...\n2) Click ...\n3) Observe ..."}
                className={`${inputStyle} min-h-[120px]`}
              />
            </div>
          </div>

          {reportError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Please fix this before sending</p>
                  <p className="mt-1">{reportError}</p>
                </div>
              </div>
            </div>
          ) : null}
          {reportMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Ready</p>
                  <p className="mt-1">{reportMessage}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Report includes account id, page URL, timestamp, and browser details for faster debugging.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void copyReport()}
                disabled={copyingReport || sendingReport}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ClipboardList className="h-4 w-4" />
                {copyingReport ? "Copying..." : "Copy full report"}
              </button>
              <button
                type="button"
                onClick={() => void sendReport()}
                disabled={sendingReport || copyingReport}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <Send className="h-4 w-4" />
                {sendingReport ? "Preparing..." : "Send report"}
              </button>
            </div>
          </div>
        </div>

        <div className="soft-card rounded-[24px] p-4 sm:rounded-[28px] sm:p-6">
          <h2 className="section-title text-2xl">Helpful checklist</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            A strong report helps us reproduce the issue fast and protect stable systems like invoice downloads.
          </p>
          <div className="mt-5 space-y-3">
            {[
              "Mention the invoice number, page, or setting involved.",
              "Write the exact steps you followed before the issue appeared.",
              "Explain what you expected to happen instead.",
              "Include device or browser details if the issue is mobile-only.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
