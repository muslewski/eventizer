import { AuthServiceProvider } from '@/components/providers/AuthServiceProvider'
import { ReactNode } from 'react'

import '@/styles/global.css'
export interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <AuthServiceProvider>{children}</AuthServiceProvider>
    </div>
  )
}

export default Layout
