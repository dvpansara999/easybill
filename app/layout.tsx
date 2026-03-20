import "./globals.css"
import { BusinessProvider } from "@/context/BusinessContext"
import { SettingsProvider } from "@/context/SettingsContext"
import { Manrope, Fraunces } from "next/font/google"
import { AppAlertProvider } from "@/components/providers/AppAlertProvider"
import SupabaseAuthSync from "@/components/providers/SupabaseAuthSync"
import KvHydrationGate from "@/components/providers/KvHydrationGate"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata = {
  title: "easyBILL",
  description: "easyBILL — modern invoice workspace",
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
      </body>
    </html>
  )
}
