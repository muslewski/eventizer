'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function getSubmittedForms(providerId: number) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'submitted-forms',
      where: {
        provider: { equals: providerId },
      },
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
    })

    return { success: true as const, data: result.docs }
  } catch (err) {
    console.error('[getSubmittedForms]', err)
    return { success: false as const, error: 'Nie udało się pobrać formularzy' }
  }
}

export async function updateFormStatus(id: number, status: 'new' | 'read' | 'replied') {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const result = await payload.update({
      collection: 'submitted-forms',
      id,
      data: { status },
      overrideAccess: true,
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[updateFormStatus]', err)
    return { success: false as const, error: 'Nie udało się zaktualizować statusu formularza' }
  }
}
