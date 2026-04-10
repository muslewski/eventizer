'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { StarIcon } from 'lucide-react'
import type { User } from '@/payload-types'

interface PanelMobileHeaderProps {
  user: User
}

export function PanelMobileHeader({ user }: PanelMobileHeaderProps) {
  const isServiceProvider =
    user.role === 'service-provider' || user.role === 'admin' || user.role === 'moderator'
  const roleLabel = isServiceProvider ? 'Usługodawca' : 'Klient'

  return (
    <header className="flex items-center gap-2 border-b px-4 py-3 lg:hidden">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <Badge variant="outline" className="text-accent border-accent/30">
        <StarIcon data-icon="inline-start" />
        {roleLabel}
      </Badge>
    </header>
  )
}
