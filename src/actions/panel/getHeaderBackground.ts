'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

let cachedUrl: string | null | undefined

export async function getHeaderBackgroundUrl(): Promise<string | null> {
  if (cachedUrl !== undefined) return cachedUrl

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'media',
    where: { filename: { equals: '404-background-compressed.jpeg' } },
    limit: 1,
  })

  cachedUrl = result.docs[0]?.url ?? null
  return cachedUrl
}
