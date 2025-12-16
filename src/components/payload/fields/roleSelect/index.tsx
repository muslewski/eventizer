'use client'

import { getRoleConfig, Role, userRoles } from '@/access/hierarchy'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth, useField } from '@payloadcms/ui'
import * as Icons from '@/components/icons'
import { cn } from '@/lib/utils'
import { User } from '@/payload-types'

const RoleSelectField = () => {
  const { value, setValue, path } = useField<Role>({ path: 'role' })
  const currentRole = value ? getRoleConfig(value) : null
  const RoleIcon = currentRole ? Icons[currentRole?.icon] : null

  const user = useAuth<User>()
  const userRole = user.user?.role

  // Only admins can edit the role field
  const isDisabled = userRole !== 'admin'

  // Only admins can see protected roles (like "Admin" and "Moderator")
  const visibleRoles =
    userRole === 'admin' ? userRoles : userRoles.filter((role) => !role.isProtected)

  return (
    <div className="flex flex-col gap-2 mb-4">
      <label className="text-sm font-medium text-stone-700 dark:text-stone-300" htmlFor={path}>
        Role
      </label>
      <Select
        value={value ?? undefined}
        onValueChange={(val) => setValue(val as Role)}
        disabled={isDisabled}
      >
        <SelectTrigger
          className={cn(
            'w-full h-11 px-3',
            'bg-white dark:bg-stone-900',
            'border-2 rounded-lg',
            'transition-all duration-200',
            'hover:border-opacity-80',
            'focus:outline-none focus:ring-0',
          )}
        >
          <SelectValue placeholder="Select a role">
            {currentRole && RoleIcon && (
              <div className="flex items-center gap-2.5">
                <RoleIcon size={16} className={currentRole.color.text} strokeWidth={2} />
                <span className="font-medium text-stone-800 dark:text-stone-200">
                  {currentRole.label}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-lg shadow-lg overflow-hidden p-1">
          {visibleRoles.map((role) => {
            const Icon = Icons[role.icon]
            const isSelected = value === role.value

            return (
              <SelectItem
                key={role.value}
                value={role.value}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5',
                  'cursor-pointer rounded-md',
                  'transition-all duration-150',
                  'hover:bg-stone-50 dark:hover:bg-stone-800/50',
                  isSelected && 'bg-stone-100 dark:bg-stone-800',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    'border-2 bg-white dark:bg-stone-900',
                    role.color.border,
                  )}
                >
                  <Icon size={14} className={role.color.text} strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {role.label}
                  </span>
                  {role.isProtected && (
                    <span className="text-xs text-stone-400 dark:text-stone-500">Protected</span>
                  )}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

export default RoleSelectField
