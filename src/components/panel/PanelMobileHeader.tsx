'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'

export function PanelMobileHeader() {
  return (
    <div className="flex items-center gap-2 px-4 pt-22 pb-3 md:hidden">
      <SidebarTrigger />
      <span className="text-sm text-muted-foreground">Nawigacja panelu</span>
    </div>
  )
}
