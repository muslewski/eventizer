'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function getUserFirstOfferId(userId: number): Promise<number | null> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'offers',
    where: {
      user: { equals: userId },
    },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
    select: {},
  })

  return result.docs[0]?.id ?? null
}
