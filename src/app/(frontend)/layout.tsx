import React from 'react'
import '@/styles/global.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/Theme'

export const metadata = {
  description: 'Eventizer - Event Management Platform',
  title: 'Eventizer',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
