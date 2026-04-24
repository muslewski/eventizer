'use client'

import dynamic from 'next/dynamic'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PanelNav } from '@/components/panel/PanelNav'
import { PanelMobileHeader } from '@/components/panel/PanelMobileHeader'
import type { User } from '@/payload-types'

const SquircleShift = dynamic(() => import('@/components/react-bits/squircle-shift'), {
  ssr: false,
})

interface PanelShellProps {
  user: User
  lang: string
  children: React.ReactNode
}

export function PanelShell({ user, lang, children }: PanelShellProps) {
  return (
    <>
      {/* Fixed background — dark theme only, desktop only */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden dark:md:block">
        <SquircleShift
          width="100%"
          height="100%"
          speed={0.4}
          waveSpeed={0.45}
          waveIntensity={0.65}
          colorTint="#d28c08"
          darkBackground="#080808"
          brightness={0.95}
        />
      </div>

      <SidebarProvider className="min-h-0 relative z-10">
        <PanelNav user={user} lang={lang} />
        <SidebarInset className="bg-transparent">
          <PanelMobileHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-2 md:p-6 md:pt-28 lg:p-8 lg:pt-28">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
