import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/theme-provider"
import { SystemInitializer } from "@/components/system-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KOVA V4 - Ethereal Depth Experience",
  description: "Immersive scroll-driven web experience by Traction Labs Design",
  keywords: ["immersive", "scroll", "web experience", "animation", "design"],
  authors: [{ name: "Traction Labs Design" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#020010",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-[#020010] text-white overflow-x-hidden")}>
        <Providers>
          <SystemInitializer />
          {children}
        </Providers>
      </body>
    </html>
  )
}