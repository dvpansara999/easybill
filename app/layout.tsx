import "./globals.css"
import type { Metadata } from "next"
import { BusinessProvider } from "@/context/BusinessContext"
import { SettingsProvider } from "@/context/SettingsContext"
import { Manrope, Fraunces } from "next/font/google"
import { AppAlertProvider } from "@/components/providers/AppAlertProvider"
import SupabaseAuthSync from "@/components/providers/SupabaseAuthSync"
import KvHydrationGate from "@/components/providers/KvHydrationGate"
import { Analytics } from "@vercel/analytics/next"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "easyBILL",
  description: "easyBILL — modern invoice workspace",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <AppAlertProvider>
          <SupabaseAuthSync />
          <KvHydrationGate>
            <SettingsProvider>
              <BusinessProvider>{children}</BusinessProvider>
            </SettingsProvider>
          </KvHydrationGate>
        </AppAlertProvider>
        <Analytics />
      </body>
    </html>
  )
}
