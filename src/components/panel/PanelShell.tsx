'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { PanelNav } from '@/components/panel/PanelNav'
import { PanelMobileHeader } from '@/components/panel/PanelMobileHeader'
import type { User } from '@/payload-types'

interface PanelShellProps {
  user: User
  lang: string
  children: React.ReactNode
}

export function PanelShell({ user, lang, children }: PanelShellProps) {
  return (
    <SidebarProvider className="min-h-0">
      <PanelNav user={user} lang={lang} />
      <SidebarInset>
        <PanelMobileHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-2 sm:p-6 sm:pt-28 lg:p-8 lg:pt-28">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
