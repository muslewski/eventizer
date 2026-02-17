'use client'

import { AvatarDropdown } from '@/components/shared/AvatarDropdown'
import { useRootAuth } from '@/providers/RootAuthProvider'

export function HeaderAvatar({ label, noBorder }: { label?: string; noBorder?: boolean }) {
  const { user, logout } = useRootAuth()

  if (!user) return null

  return <AvatarDropdown user={user} variant="frontend" onLogout={logout} label={label} noBorder={noBorder} />
}
