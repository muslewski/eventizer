'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'

export function PanelMobileHeader() {
  return (
    <div className="flex items-center px-4 pt-22 pb-3 md:hidden">
      <SidebarTrigger />
    </div>
  )
}
