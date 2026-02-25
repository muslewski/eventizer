'use client'

import type { ReactNode } from 'react'
import { AvatarDropdown } from '@/components/shared/AvatarDropdown'
import { useRootAuth } from '@/providers/RootAuthProvider'
import { hasRole } from '@/components/shared/AvatarDropdown/utils'

function getRoleLabel(role: string | null | undefined): string | null {
  switch (role) {
    case 'admin':
      return 'Panel Administracyjny'
    case 'moderator':
      return 'Panel Moderatora'
    case 'service-provider':
      return 'Panel Usługodawcy'
    default:
      return null
  }
}

export function HeaderAvatar({
  label,
  noBorder,
  variant = 'header',
}: {
  label?: ReactNode
  noBorder?: boolean
  variant?: 'header' | 'sticky' | 'mobile'
}) {
  const { user, logout } = useRootAuth()

  if (!user) return null

  // For header/sticky variants, auto-generate the role label if none provided
  let resolvedLabel: ReactNode = label
  if (!resolvedLabel && variant !== 'mobile') {
    const roleText = getRoleLabel(user.role)
    if (roleText) {
      resolvedLabel = (
        <span className="text-sm font-medium tracking-wide text-base-700 dark:text-white/70">
          {roleText}
        </span>
      )
    }
  }

  return <AvatarDropdown user={user} variant="frontend" onLogout={logout} label={resolvedLabel} noBorder={noBorder} />
}
