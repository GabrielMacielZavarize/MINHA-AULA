import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/lib/theme"
import { I18nProvider } from "@/lib/i18n"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata = {
  title: "Minha Aula - Sistema de Gerenciamento",
  description: "Sistema completo para gerenciamento de aulas particulares",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider>
            <div className="min-h-screen bg-background text-foreground">{children}</div>
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
