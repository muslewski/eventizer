'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export interface UserOffersInfo {
  firstId: number | null
  /** Total number of offers the user has created. */
  count: number
}

export async function getUserOffersInfo(userId: number): Promise<UserOffersInfo> {
  const payload = await getPayload({ config })

  // Fetch up to 2 so we can distinguish "1 offer" from "more than 1"
  // without pulling all docs. totalDocs gives the real count.
  const result = await payload.find({
    collection: 'offers',
    where: {
      user: { equals: userId },
    },
    sort: 'createdAt',
    limit: 2,
    depth: 0,
    select: {},
  })

  return {
    firstId: result.docs[0]?.id ?? null,
    count: result.totalDocs,
  }
}
