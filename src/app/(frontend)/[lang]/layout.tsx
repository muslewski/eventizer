import React from 'react'
import type { Metadata } from 'next'
import { getServerSideURL } from '@/utilities/getURL'
import '@/styles/global.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/Theme'
import { Bebas_Neue, Montserrat } from 'next/font/google'
import Header from '@/components/frontend/Header'
import Footer from '@/components/frontend/Footer'
import { RootAuthProvider } from '@/providers/RootAuthProvider'
import { Analytics } from '@vercel/analytics/next'
import { SuppressHydrationWarnings } from '@/components/providers/SuppressHydrationWarnings'
import { LenisProvider } from '@/components/providers/LenisProvider'
import { PreloaderProvider } from '@/components/providers/PreloaderProvider'

/**
 * Toggle for the Lenis smooth-scroll provider. Disabled for now; flip back to
 * `true` to restore Lenis-driven smooth scrolling site-wide.
 */
const ENABLE_LENIS = false

export const metadata: Metadata = {
  // metadataBase lets Next resolve relative URLs (icons, og:image fallbacks)
  // against the real origin instead of localhost — and silences the build-time
  // "metadataBase not set" warning.
  metadataBase: new URL(getServerSideURL()),
  description: 'Eventizer — łączymy ludzi z pasją do tworzenia niezapomnianych chwil.',
  title: 'Eventizer',
}

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    return []
  }
  return [{ lang: 'pl' }, { lang: 'en' }]
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>
}>) {
  const { lang } = await params

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${montserrat.variable} overflow-x-clip`}
    >
      <head>
        <link rel="icon" type="image/png" href="/my-favicon/icon-1.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/my-favicon/icon0.svg" />
        <link rel="shortcut icon" href="/my-favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/my-favicon/apple-icon.png" />
        <link rel="manifest" href="/my-favicon/manifest.json" />
      </head>
      <body className="bg-background h-full" suppressHydrationWarning>
        <SuppressHydrationWarnings />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {(() => {
            const inner = (
              <PreloaderProvider>
                <RootAuthProvider>
                  <div className="w-full px-4 sm:px-8 transition-[padding] duration-900 ease-in-out">
                    <main className="w-full relative">
                      <Header />
                      <div className="w-full relative ease-in-out">{children}</div>
                    </main>
                  </div>
                  <Footer />
                  <Toaster />
                </RootAuthProvider>
              </PreloaderProvider>
            )
            return ENABLE_LENIS ? <LenisProvider>{inner}</LenisProvider> : inner
          })()}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
