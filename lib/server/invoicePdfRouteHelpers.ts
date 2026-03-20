import { NextResponse } from "next/server"
import type { PdfApiErrorBody } from "@/lib/pdfApiContract"

export function parseJsonLoose(raw: unknown): unknown {
  if (raw == null) return null
  if (typeof raw === "object") return raw
  if (typeof raw !== "string") return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function pdfError(message: string, code: PdfApiErrorBody["code"], status: number) {
  const body: PdfApiErrorBody = { error: message, code }
  return NextResponse.json(body, { status })
}
