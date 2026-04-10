'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function getHelpTickets(userId: number) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'help-tickets',
      where: {
        user: { equals: userId },
      },
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    })

    return { success: true as const, data: result.docs }
  } catch (err) {
    console.error('[getHelpTickets]', err)
    return { success: false as const, error: 'Nie udało się pobrać zgłoszeń pomocy' }
  }
}

export async function createHelpTicket(data: {
  title: string
  email: string
  description: string
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    // description is a richText field — wrap plain text in a minimal Lexical document
    const descriptionRichText = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: data.description,
                version: 1,
              },
            ],
            version: 1,
          },
        ],
        direction: null as null,
        format: '' as '',
        indent: 0,
        version: 1,
      },
    }

    const result = await payload.create({
      collection: 'help-tickets',
      data: {
        title: data.title,
        email: data.email,
        description: descriptionRichText,
        user: Number(session.user.id),
        isSolved: false,
      },
      overrideAccess: true,
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[createHelpTicket]', err)
    return { success: false as const, error: 'Nie udało się utworzyć zgłoszenia pomocy' }
  }
}
