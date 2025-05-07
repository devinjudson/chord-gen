import type { Metadata } from "next"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { VolumeControl } from "@/components/volume-control"
import BeamsBackground from "@/components/beams-background"
import Navigation from "@/components/navigation"
import "./globals.css"

export const metadata: Metadata = {
  title: "ChordGen | Advanced Music Generator",
  description: "Create stunning chord progressions and melodies with this powerful music generator",
  keywords: "chord progression, music generator, melody generator, MIDI export, music composition",
  authors: [{ name: "ChordGen Team" }],
  openGraph: {
    title: "ChordGen | Advanced Music Generator",
    description: "Create stunning chord progressions and melodies with this powerful music generator",
    url: "https://chordgen.vercel.app",
    siteName: "ChordGen",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChordGen - Advanced Music Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChordGen | Advanced Music Generator",
    description: "Create stunning chord progressions and melodies with this powerful music generator",
    images: ["/og-image.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="grid-background fixed inset-0 z-[-1] opacity-30"></div>
          <BeamsBackground intensity="medium" />
          <div className="fixed top-0 left-0 right-0 z-10 py-2 px-4 flex justify-between items-center">
            <Navigation />
            <div className="flex items-center gap-2">
              <VolumeControl />
              <ThemeToggle />
            </div>
          </div>
          <main className="pt-14 md:pt-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
