'use client'

import { AvatarDropdown } from '@/components/shared/AvatarDropdown'
import { User } from '@/payload-types'
import { useAuth } from '@payloadcms/ui'

export default function CustomHeader() {
  const { user } = useAuth()

  if (!user) return null

  const typedUser = user as unknown as User
  return (
    <div className="h-0 w-full relative">
      {/* Position avatar dropdown at the top right corner */}
      <div className="absolute z-10 top-[calc(100%+2rem)] right-16">
        <AvatarDropdown user={typedUser} variant="admin" showHomeLink />
      </div>
    </div>
  )
}
