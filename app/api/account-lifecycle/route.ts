import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  deleteWorkspaceAccount,
  requestAccountLifecycleOtp,
  resetWorkspaceAccount,
  type AccountLifecycleVerification,
} from "@/lib/server/accountLifecycle"
import { redactSensitiveData } from "@/lib/workspaceSecurity"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

type LifecycleRequest =
  | { op: "requestOtp"; action?: "reset" | "delete" }
  | { op: "reset"; verification?: AccountLifecycleVerification }
  | { op: "delete"; verification?: AccountLifecycleVerification }

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function publicError(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object") {
    const redacted = redactSensitiveData(error)
    if (redacted && typeof redacted === "object" && "message" in redacted && typeof redacted.message === "string") {
      return redacted.message
    }
  }
  return "Account operation failed."
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LifecycleRequest
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse("Sign in before changing your account.", 401)

  try {
    if (body.op === "requestOtp") {
      if (body.action !== "reset" && body.action !== "delete") return errorResponse("Lifecycle action is required.")
      await requestAccountLifecycleOtp(user)
      return NextResponse.json({ ok: true })
    }

    if (body.op === "reset") {
      await resetWorkspaceAccount(user, body.verification || { phrase: "" })
      return NextResponse.json({ ok: true, userId: user.id })
    }

    if (body.op === "delete") {
      await deleteWorkspaceAccount(user, body.verification || { phrase: "" })
      return NextResponse.json({ ok: true, userId: user.id })
    }

    return errorResponse("Unsupported account operation.")
  } catch (error) {
    return errorResponse(publicError(error), 500)
  }
}

