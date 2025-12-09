'use client'

import { getRoleConfig, Role, userRoles } from '@/access/hierarchy'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useField } from '@payloadcms/ui'
import * as Icons from '@/components/icons'

const RoleSelect = () => {
  const { value, setValue, path } = useField<Role>({ path: 'role' })
  const currentRole = value ? getRoleConfig(value) : null
  const RoleIcon = currentRole ? Icons[currentRole.icon] : null

  return (
    <div className="field-label">
      <label className="field-label" htmlFor={path}>
        Role
      </label>
      <Select value={value} onValueChange={(val) => setValue(val as Role)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a role">
            {currentRole && RoleIcon && (
              <span>
                <RoleIcon size={16} />
                {currentRole.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {userRoles.map((role) => {
            const Icon = Icons[role.icon]
            return (
              <SelectItem key={role.value} value={role.value}>
                <Icon size={16} className={role.color.text} />
                {role.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

export default RoleSelect
