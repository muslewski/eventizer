'use client'

import { useAuth } from '@payloadcms/ui'
import { getRoleConfig } from '@/access/hierarchy'
import * as Icons from '@/components/icons'

const CustomBeforeNav: React.FC = () => {
  const { user } = useAuth()

  if (!user) return null

  const roleConfig = getRoleConfig(user.role)

  // Don't render if no role config exists for this user
  if (!roleConfig) return null

  const RoleIcon = Icons[roleConfig.icon]

  return (
    <div className="w-full px-1 mb-4">
      <div
        className={`
          relative overflow-hidden rounded-lg border
          bg-gradient-to-r from-white to-stone-50
          dark:from-stone-900 dark:to-stone-800
          ${roleConfig.color.border}
          shadow-sm
        `}
      >
        {/* Accent bar on the left */}
        <div className={`absolute left-0 top-0 h-full w-1 ${roleConfig.color.bg}`} />

        <div className="flex items-center gap-3 py-3 pl-4 pr-3">
          {/* Icon container with role color */}
          <div
            className={`
              flex h-9 w-9 shrink-0 items-center justify-center rounded-full
              ${roleConfig.color.bg} bg-opacity-15 dark:bg-opacity-20
            `}
          >
            {RoleIcon && <RoleIcon size={18} className={roleConfig.color.text} strokeWidth={2.5} />}
          </div>

          {/* Text content */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Twoja rola
            </span>
            <span className={`text-sm font-semibold ${roleConfig.color.text}`}>
              {roleConfig.label}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomBeforeNav
