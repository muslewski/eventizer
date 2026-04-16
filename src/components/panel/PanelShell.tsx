'use client'

import dynamic from 'next/dynamic'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PanelNav } from '@/components/panel/PanelNav'
import { PanelMobileHeader } from '@/components/panel/PanelMobileHeader'
import type { User } from '@/payload-types'

const LiquidLines = dynamic(() => import('@/components/react-bits/liquid-lines'), {
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
      {/* Fixed background — behind everything */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <LiquidLines
          width="100%"
          height="100%"
          speed={0.2}
          iterations={3}
          waveFrequency={40}
          lineThickness={0.006}
          waveAmplitude={0.5}
          brightness={1.5}
          contrast={1.0}
          scale={0.25}
          opacity={0.4}
          darkBackground="#0b0b0b"
          lightBackground="#fffdf9"
          lineColor="#d28c08"
        />
      </div>

      <SidebarProvider className="min-h-0 relative z-10">
        <PanelNav user={user} lang={lang} />
        <SidebarInset className="bg-transparent">
          <PanelMobileHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-2 md:p-6 md:pt-28 lg:p-8 lg:pt-28">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
