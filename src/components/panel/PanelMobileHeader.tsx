'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { PanelLeftIcon } from 'lucide-react'

export function PanelMobileHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="flex items-center px-4 pt-22 pb-3 md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="gap-2 text-muted-foreground"
      >
        <PanelLeftIcon className="size-4" />
        Nawigacja panelu
      </Button>
    </div>
  )
}
