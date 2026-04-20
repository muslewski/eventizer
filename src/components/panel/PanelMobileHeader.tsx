'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ArrowRightFromLine } from 'lucide-react'

export function PanelMobileHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="flex items-center px-4 pt-22 pb-3 md:hidden">
      <Button
        variant="outline"
        onClick={toggleSidebar}
        className="w-full justify-start gap-2 rounded-full px-5 text-muted-foreground"
      >
        <ArrowRightFromLine className="size-4" />
        <span className="font-bebas tracking-wide text-base">Menu panelu</span>
      </Button>
    </div>
  )
}
