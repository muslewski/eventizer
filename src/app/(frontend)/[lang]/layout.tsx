import React from 'react'
import '@/styles/global.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/Theme'
import { Bebas_Neue, Montserrat } from 'next/font/google'
import Header from '@/components/frontend/Header'
import type { Config } from '@/payload-types'

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
      className={`${bebasNeue.variable} ${montserrat.variable}`}
    >
      <body className="bg-white dark:bg-[#0B0B0D]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className=" -mt-8 px-8 w-full relative">
            <Header />
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
