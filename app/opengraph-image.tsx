import { ImageResponse } from "next/og"
import { BRAND_DESCRIPTION, BRAND_NAME } from "@/lib/marketing/siteMetadata"

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
          background: "linear-gradient(135deg, #f4f8ff 0%, #edf4ff 52%, #ffffff 100%)",
          fontFamily: "sans-serif",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto auto 0",
            width: 520,
            height: 520,
            borderRadius: "999px",
            background: "radial-gradient(circle, rgba(147,197,253,0.25) 0%, rgba(147,197,253,0) 70%)",
            transform: "translate(-80px, -110px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -120,
            bottom: -160,
            width: 560,
            height: 560,
            borderRadius: "999px",
            background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "56px 64px",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 26,
                  background: "linear-gradient(135deg, #3b4046 0%, #2a2f35 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 42,
                  fontWeight: 800,
                  letterSpacing: "-0.06em",
                  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
                }}
              >
                eB
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.05em" }}>{BRAND_NAME}</div>
                <div style={{ fontSize: 20, color: "#64748b", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Create | Send | Track
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 560 }}>
              <div style={{ fontSize: 72, lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.06em" }}>
                Professional invoices, made easy.
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.45, color: "#475569" }}>
                Calm defaults, clean PDFs, and a workspace that stays out of your way.
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {["GST-ready", "A4 PDF export", "Cloud sync"].map((label) => (
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
                    fontSize: 22,
                    fontWeight: 600,
                    boxShadow: "0 10px 24px rgba(148,163,184,0.12)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 400,
              borderRadius: 36,
              background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)",
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 28px 60px rgba(15, 23, 42, 0.16)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: "#f87171" }} />
                <div style={{ width: 10, height: 10, borderRadius: 999, background: "#fbbf24" }} />
                <div style={{ width: 10, height: 10, borderRadius: 999, background: "#34d399" }} />
              </div>
              <div style={{ fontSize: 16, color: "#64748b", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Same templates as the app
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 28,
                overflow: "hidden",
                border: "1px solid rgba(191,219,254,0.85)",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "22px 24px",
                  background: "linear-gradient(135deg, #e7f0ff 0%, #f8fbff 100%)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 30, fontWeight: 800 }}>ABC Business</div>
                  <div style={{ fontSize: 16, color: "#64748b" }}>{BRAND_DESCRIPTION}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ fontSize: 16, color: "#64748b" }}>Invoice</div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>INV-0001</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", padding: "18px 24px", gap: 14 }}>
                {[
                  ["Client", "John Doe"],
                  ["Products", "2 saved items"],
                  ["Amount", "Rs 1,534.00"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 14,
                      borderBottom: "1px solid rgba(226,232,240,0.8)",
                      fontSize: 20,
                    }}
                  >
                    <span style={{ color: "#64748b" }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
