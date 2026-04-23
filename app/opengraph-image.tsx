import { ImageResponse } from "next/og"
import { BRAND_DESCRIPTION, BRAND_NAME } from "@/lib/marketing/siteMetadata"

export const runtime = "edge"
export const alt = `${BRAND_NAME} preview card`
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #f3f7ff 0%, #eef5ff 56%, #ffffff 100%)",
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -60,
            width: 520,
            height: 520,
            borderRadius: "999px",
            background: "radial-gradient(circle, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0) 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -100,
            bottom: -180,
            width: 560,
            height: 560,
            borderRadius: "999px",
            background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0) 72%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            padding: "58px 64px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 24,
                background: "linear-gradient(135deg, #2f343a 0%, #20242a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.06em",
                boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
              }}
            >
              eB
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.05em" }}>{BRAND_NAME}</div>
              <div style={{ fontSize: 18, color: "#64748b", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Invoice workspace
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 760 }}>
            <div style={{ fontSize: 68, lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.06em" }}>
              Professional invoices, made easy.
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.45, color: "#475569" }}>{BRAND_DESCRIPTION}</div>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {["Invoice workspace", "Cloud sync", "PDF export"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#0f172a",
                  fontSize: 20,
                  fontWeight: 600,
                  boxShadow: "0 10px 24px rgba(148,163,184,0.12)",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
