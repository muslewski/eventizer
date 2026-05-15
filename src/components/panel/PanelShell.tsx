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
          Light mode: opacity-50 lets the body bg (near-white) blend through
          the shader so the gold pattern + beige tone wash out by half —
          turning the background into faint ambient texture instead of a
          visible pattern. brightnessLight=0.35 already dialed the pattern
          down inside the shader; the wrapper opacity adds a second-stage
          attenuation that's easy to tune. Dark mode stays at full opacity. */}
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block opacity-50 dark:opacity-100">
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
