import { Role, getRoleConfig } from '@/access/hierarchy'
import type { User } from '@/payload-types'
import { Access, ClientUser, FieldAccess } from 'payload'

/**
 * @returns true if user.role in roles
 */
export const checkRole = (roles: User['role'][], user?: User | null): boolean => {
  if (user && user.role) {
    return roles.includes(user.role)
  }

  return false
}

/**
 * Get all roles at or above the given role in the hierarchy.
 */
export const getRolesAtOrAbove = (role: Role): Role[] => {
  const roles: Role[] = [role] // Step 1: Start with the given role
  let current: Role | null = role // Step 2: Set a "pointer" to track where we are

  // Step 3: Keep pulling parents until there are no more
  while (current) {
    const parent: Role | null = getRoleConfig(current).parent // Step 4: Move up to the parent
    if (parent) roles.push(parent) // Step 5: Add parent to our list
    current = parent // Step 6: Update pointer to the parent
  }

  return roles
}

// ============ Client Role Checkers ============

/**
 * Checks if clientUser has a specific role
 */
export const isClientRoleEqual = (role: User['role'], clientUser?: ClientUser | null): boolean => {
  if (clientUser && clientUser.role) {
    return clientUser.role === role
  }

  return false
}

/** Check if client role equal or is higher */
export const isClientRoleEqualOrHigher = (
  role: User['role'],
  clientUser?: ClientUser | null,
): boolean => {
  if (clientUser && clientUser.role) {
    const allowedRoles = getRolesAtOrAbove(role)
    return allowedRoles.includes(clientUser.role)
  }

  return false
}

// ============ Collection Access Factories ============

/**
 * Factory: Creates an access control for a role and all higher roles
 */
export const roleOrHigher = (role: User['role']): Access => {
  const allowedRoles = getRolesAtOrAbove(role)
  return ({ req: { user } }) => {
    if (user) return checkRole(allowedRoles, user)
    return false
  }
}

/**
 * Factory: Creates an access control for a role (or higher) OR if user owns the document.
 */
export const roleOrHigherOrSelf = (role: User['role'], field: string = 'id'): Access => {
  const allowedRoles = getRolesAtOrAbove(role)
  return ({ req: { user } }) => {
    if (user) {
      if (checkRole(allowedRoles, user)) return true
      return { [field]: { equals: user.id } }
    }
    return false
  }
}

/**
 * Factory: Creates an access control for a role (or higher) OR if the field mathes the user's email.
 */
export const roleOrHigherOrSelfByEmail = (role: User['role'], field: string = 'email'): Access => {
  const allowedRoles = getRolesAtOrAbove(role)
  return ({ req: { user } }) => {
    if (user) {
      if (checkRole(allowedRoles, user)) return true
      return { [field]: { equals: user.email } }
    }
    return false
  }
}

// ============ Field Access Factories ============

/**
 * Factory: Creates a field access control for a role and all higher roles
 */
export const fieldRoleOrHigher = (role: User['role']): FieldAccess => {
  const allowedRoles = getRolesAtOrAbove(role)
  return ({ req: { user } }) => {
    if (user) return checkRole(allowedRoles, user)
    return false
  }
}

/**
 * Factory Creates a field access control for a role (or higher) OR if user owns the document.
 */
export const fieldRoleOrHigherOrSelf = (role: User['role']): FieldAccess => {
  const allowedRoles = getRolesAtOrAbove(role)
  return ({ req: { user }, id }) => {
    if (user) {
      if (checkRole(allowedRoles, user)) return true
      return id === user.id
    }
    return false
  }
}
