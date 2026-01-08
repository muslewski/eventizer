import { AuthProvider } from '@/components/providers/AuthProvider'
import { ReactNode } from 'react'

import '@/styles/global.css'
export interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <AuthProvider>{children}</AuthProvider>
    </div>
  )
}

export default Layout
