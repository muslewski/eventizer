'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { auth } from '@/auth/auth'

interface UpdateUserServiceCategoryInput {
  userId: string
  categoryNames: string[]
  categorySlugs: string[]
}

export async function updateUserServiceCategory({
  userId,
  categoryNames,
  categorySlugs,
}: UpdateUserServiceCategoryInput): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the current user is the same as the userId being updated
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user || session.user.id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    // Create human-readable category path (e.g., "Music > DJ > Wedding DJ")
    const serviceCategory = categoryNames.join(' > ')

    // Create machine-readable slug path (e.g., "music/dj/wedding-dj")
    const serviceCategorySlug = categorySlugs.join('/')

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        serviceCategory,
        serviceCategorySlug,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating user service category:', error)
    return { success: false, error: 'Failed to update service category' }
  }
}
