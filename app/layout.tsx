import "./globals.css"
import type { Metadata } from "next"
import { siteOrigin } from "@/lib/marketing/siteOrigin"
import {
  absoluteSiteUrl,
  BRAND_DESCRIPTION,
  BRAND_LOGO_PATH,
  BRAND_NAME,
  defaultMetadataImages,
} from "@/lib/marketing/siteMetadata"
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

const metadataImages = defaultMetadataImages()

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: BRAND_NAME,
    template: `%s | ${BRAND_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: BRAND_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    url: "/",
    siteName: BRAND_NAME,
    type: "website",
    images: metadataImages,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    images: metadataImages.map((image) => image.url),
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#2a2f35" }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: BRAND_NAME,
      url: siteOrigin(),
      logo: absoluteSiteUrl(BRAND_LOGO_PATH),
      image: absoluteSiteUrl(BRAND_LOGO_PATH),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND_NAME,
      url: siteOrigin(),
      publisher: {
        "@type": "Organization",
        name: BRAND_NAME,
        logo: {
          "@type": "ImageObject",
          url: absoluteSiteUrl(BRAND_LOGO_PATH),
        },
      },
    },
  ]

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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
