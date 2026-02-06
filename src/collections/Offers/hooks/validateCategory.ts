import { isClientRoleEqualOrHigher } from '@/access/utilities'
import type { CollectionBeforeValidateHook } from 'payload'

export const validateCategory: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  if (!data?.category || !req.user) return data

  // Skip validation for admins/moderators
  if (isClientRoleEqualOrHigher('moderator', req.user)) {
    return data
  }

  // Validate category access for create/update
  if (operation === 'create' || operation === 'update') {
    const { validateOfferCategory } = await import('@/actions/getOfferCategories')
    const validation = await validateOfferCategory(data.category)

    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid category selection')
    }
  }

  return data
}
