import { Access, FieldAccess } from 'payload'
import { roleOrHigher, roleOrHigherOrSelf, fieldRoleOrHigher } from './utilities'

export const publicAccess: Access = () => true

// Public field-level access (everyone can read/update the field)
export const publicAccessField: FieldAccess = () => true

// ============ Collection Access ============

/** Only admins can access */
export const adminOrHigher = roleOrHigher('admin')

/** Moderators and admins can access */
export const moderatorOrHigher = roleOrHigher('moderator')

/** Providers, moderators, and admins can access (NOT clients) */
export const providerOrHigher = roleOrHigher('service-provider')

/** Clients, moderators, and admins can access (NOT providers) */
export const clientOrHigher = roleOrHigher('client')

/** Admins and creators of documents */
export const adminOrHigherOrSelf = (field: string = 'id') => roleOrHigherOrSelf('admin', field)

/**
 * Moderators and admins can access all documents.
 * Providers and clients can only access their own document.
 *
 * @example Orders — mods see all, clients see only their own
 * @example Services — mods see all, providers see only their own
 */
export const moderatorOrHigherOrSelf = (field: string = 'id') =>
  roleOrHigherOrSelf('moderator', field)
// ============ Field Access ============

/** Only admins can read/update this field */
export const fieldAdminOrHigher = fieldRoleOrHigher('admin')

/** Moderators and admins can read/update this field */
export const fieldModeratorOrHigher = fieldRoleOrHigher('moderator')
