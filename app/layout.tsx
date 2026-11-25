import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Toaster } from "sonner"
import { GlobalNumberInputListener } from "@/components/common/GlobalNumberInputListener"

const sora = localFont({
  src: [
    {
      path: "../public/fonts/sora-300.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/sora-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/sora-500.ttf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-sora",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "StayNext - Hotel Management", template: "%s | StayNext" },
  description: "Professional Hotel, Lodge & Resort Management SaaS",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full ${sora.variable}`}>
      <body suppressHydrationWarning className={`h-full bg-gray-50 font-sans antialiased ${sora.className}`}>
        <GlobalNumberInputListener />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
