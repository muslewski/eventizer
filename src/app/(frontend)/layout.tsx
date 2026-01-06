import React from 'react'
import '@/styles/global.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/Theme'
import { Bebas_Neue, Montserrat } from 'next/font/google'

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

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bebasNeue.variable} ${montserrat.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="bg-[#797890] dark:bg-[#0B0B0D] px-8 pt-8 -top-16 w-full relative">
            <nav className="rounded-t-2xl h-16 relative z-20 top-16 w-full border-b border-white/50 bg-black/5 backdrop-blur-md flex items-center px-8">
              Header
            </nav>
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
