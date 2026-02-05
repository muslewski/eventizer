'use client'

import { AvatarDropdown } from '@/components/shared/AvatarDropdown'
import type { User } from '@/payload-types'
import { useAuth } from '@payloadcms/ui'

const AdminAvatar = () => {
  const { user } = useAuth()

  if (!user) return null

  const typedUser = user as unknown as User

  return <AvatarDropdown user={typedUser} variant="admin" showHomeLink />
}

export default AdminAvatar
