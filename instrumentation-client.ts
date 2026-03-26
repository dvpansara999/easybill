function shouldEnableRuntimeMonitoring() {
  return process.env.NEXT_PUBLIC_RUNTIME_MONITORING === "1"
}

function sendRuntimeEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined" || !shouldEnableRuntimeMonitoring()) return
  void fetch("/api/runtime-monitor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      path: window.location.pathname,
      at: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {})
}

export function register() {
  if (typeof window === "undefined" || !shouldEnableRuntimeMonitoring()) return

  window.addEventListener("error", (event) => {
    sendRuntimeEvent({
      type: "window-error",
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    sendRuntimeEvent({
      type: "unhandled-rejection",
      reason:
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === "string"
            ? event.reason
            : "Unknown rejection",
    })
  })
}
