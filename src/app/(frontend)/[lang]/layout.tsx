import React from 'react'
import '@/styles/global.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/Theme'
import { Bebas_Neue, Montserrat } from 'next/font/google'
import Header from '@/components/frontend/Header/index.client'
import type { Config } from '@/payload-types'
import Footer from '@/components/frontend/Footer'

type Locale = Config['locale']

export const metadata = {
  description: 'Eventizer - Event Management Platform',
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
  params: Promise<{ lang: Locale }>
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
      <body className="bg-background min-h-screen h-full">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <main className="w-full">
            <div className="px-4 sm:px-8 w-full relative transition-[padding] duration-900 ease-in-out">
              <Header />
              {children}
            </div>
            <Footer />
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
