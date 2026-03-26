import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>
    console.error("[runtime-monitor]", JSON.stringify(payload))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
