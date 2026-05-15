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
      {/* Fixed background — desktop only. SquircleShift switches its base
          color internally based on resolvedTheme, so the same instance works
          for light and dark.
          Light mode uses base-50 (#f7f5f0) instead of pure white — gold-on-
          warm-beige has much lower chroma contrast than gold-on-white, so
          the shader reads as ambient texture instead of a busy pattern. The
          base-50 tone also unifies the panel surface with the rest of the
          beige-leaning light palette (card-elevated at base-100, etc.). */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
        <SquircleShift
          width="100%"
          height="100%"
          speed={0.18}
          waveSpeed={0.22}
          waveIntensity={0.5}
          colorTint="#d28c08"
          lightBackground="#f7f5f0"
          darkBackground="#080808"
          brightness={0.85}
          brightnessLight={0.35}
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
