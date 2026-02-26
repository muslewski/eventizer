'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { AvatarDropdown } from '@/components/shared/AvatarDropdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRootAuth } from '@/providers/RootAuthProvider'
import { getInitials } from '@/components/shared/AvatarDropdown/utils'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import type { ProfilePicture } from '@/payload-types'

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
  href,
  onClick,
}: {
  label?: ReactNode
  noBorder?: boolean
  variant?: 'header' | 'sticky' | 'mobile'
  href?: string
  onClick?: () => void
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

  // Mobile: render a direct link instead of a dropdown
  if (variant === 'mobile' && href) {
    let imageUrl: string | null = null
    if (user?.profilePicture && isExpandedDoc<ProfilePicture>(user.profilePicture)) {
      imageUrl = user.profilePicture.url || null
    } else if (user?.image) {
      imageUrl = user.image
    }

    return (
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center gap-2 pl-0.5 pr-3 rounded-full transition-opacity hover:opacity-80"
      >
        <Avatar className="h-9 w-9 bg-white dark:bg-background/10">
          <AvatarImage src={imageUrl ?? ''} />
          <AvatarFallback className="bg-base-900/40">{getInitials(user)}</AvatarFallback>
        </Avatar>
        {resolvedLabel && <span className="leading-none">{resolvedLabel}</span>}
      </Link>
    )
  }

  return <AvatarDropdown user={user} variant="frontend" onLogout={logout} label={resolvedLabel} noBorder={noBorder} />
}
