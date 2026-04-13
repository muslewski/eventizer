'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'

export function PanelMobileHeader() {
  return (
    <div className="flex items-center px-4 py-3 lg:hidden">
      <SidebarTrigger />
    </div>
  )
}
