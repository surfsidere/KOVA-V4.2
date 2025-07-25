import type { Metadata } from 'next'
import './globals.css'
import 'lenis/dist/lenis.css'
import { LenisProvider } from '@/providers/LenisProvider'
import { SectionProvider } from '@/providers/SectionProvider'
import { AnimationProvider } from '@/providers/AnimationProvider'
import { ContrastProvider } from '@/providers/ContrastProvider'
import { SystemInitializer } from '@/components/system-initializer'

export const metadata: Metadata = {
  title: 'KOVA V4 - Ethereal Depth | Traction Labs Design',
  description: 'Next-generation loyalty platform designed by Traction Labs Design. Connecting banks, fintechs, and loyalty programs with leading digital brands.',
  generator: 'Traction Labs Design',
  keywords: 'loyalty platform, fintech, digital brands, traction labs, kova, ethereal depth',
  authors: [{ name: 'Traction Labs Design', url: 'https://tractionlabs.com' }],
  openGraph: {
    title: 'KOVA V4 - Ethereal Depth',
    description: 'Next-generation loyalty platform by Traction Labs Design',
    type: 'website',
    locale: 'es_ES',
    alternateLocale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KOVA V4 - Ethereal Depth',
    description: 'Next-generation loyalty platform by Traction Labs Design',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SystemInitializer />
        <LenisProvider
          options={{
            smooth: true,
            lerp: 0.1,
            duration: 1.2,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smoothTouch: false,
            touchMultiplier: 2,
          }}
        >
          <SectionProvider>
            <AnimationProvider>
              <ContrastProvider>
                {children}
              </ContrastProvider>
            </AnimationProvider>
          </SectionProvider>
        </LenisProvider>
      </body>
    </html>
  )
}
