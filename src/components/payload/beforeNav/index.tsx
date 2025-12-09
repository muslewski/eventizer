'use client'

import { useAuth } from '@payloadcms/ui'
import { getRoleConfig } from '@/access/hierarchy'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import * as Icons from '@/components/icons'

const CustomBeforeNav: React.FC = () => {
  const { user } = useAuth()

  if (!user) return null

  const roleConfig = getRoleConfig(user.role)
  const RoleIcon = Icons[roleConfig.icon]

  return (
    <div className="w-full">
      <Alert className="w-full bg-amber-100 dark:bg-stone-700">
        <AlertTitle>Twoja rola to</AlertTitle>
        <AlertDescription className="flex gap-2 items-center">
          {RoleIcon && <RoleIcon size={24} />}
          {roleConfig.label}
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default CustomBeforeNav
