import type React from "react"
import type { Metadata } from "next"
import { Outfit, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { PreferencesProvider } from "@/components/preferences-provider"
import { SelectionProvider } from "@/components/selection-provider"
import { ApiSessionProvider } from "@/components/api-session-provider"
import { WalkthroughHost } from "@/components/walkthrough-host"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "IMG.prcess | Document intelligence",
  description:
    "Upload CSV or documents, ask questions, and get cleaned data, charts, and explanations.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${outfit.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <PreferencesProvider>
            <ApiSessionProvider>
              <SelectionProvider>
                {children}
                <WalkthroughHost />
              </SelectionProvider>
            </ApiSessionProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
