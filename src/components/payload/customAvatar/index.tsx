'use client'

import { AvatarDropdown } from '@/components/shared/AvatarDropdown'
import type { User } from '@/payload-types'
import { useAuth } from '@payloadcms/ui'

const AdminAvatar = () => {
  const { user } = useAuth()

  if (!user) return null

  const typedUser = user as unknown as User

  return (
    <div className="translate-y-7">
      <AvatarDropdown user={typedUser} variant="admin" showHomeLink />
    </div>
  )
}

export default AdminAvatar
