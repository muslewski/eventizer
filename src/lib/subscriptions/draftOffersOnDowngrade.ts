import type { Payload } from 'payload'

export interface DraftOnDowngradeInput {
  payload: Payload
  userId: number
  newPlan: { level: number; maxOffers: number; slug?: string }
  dryRun?: boolean
}

export interface DraftOnDowngradeResult {
  draftedByCategory: number[]
  draftedByLimit: number[]
  keptPublished: number[]
}

/**
 * Pass A: draft offers whose deepest-matching category.requiredPlan.level > newPlan.level.
 * Pass B: cap remaining published to newPlan.maxOffers, keep oldest by createdAt.
 *
 * Always reads current Payload state — idempotent. Do not "optimize" by reading from Stripe events.
 */
export async function draftOffersOnDowngrade({
  payload,
  userId,
  newPlan,
  dryRun = false,
}: DraftOnDowngradeInput): Promise<DraftOnDowngradeResult> {
  const offers = (await payload.find({
    collection: 'offers',
    where: { user: { equals: userId }, _status: { equals: 'published' } },
    depth: 0,
    limit: 0,
  })).docs as Array<{ id: number; category: string; createdAt: string }>

  if (offers.length === 0) {
    return { draftedByCategory: [], draftedByLimit: [], keptPublished: [] }
  }

  const uniqueSlugPaths = Array.from(new Set(offers.map(o => o.category).filter(Boolean)))
  const levelByPath = await resolveLevelByCategoryPath(payload, uniqueSlugPaths)

  // Pass A
  const draftedByCategory: number[] = []
  let stillPublished = offers.filter((o) => {
    const level = levelByPath.get(o.category)
    if (level === undefined) return true
    if (level > newPlan.level) {
      draftedByCategory.push(o.id)
      return false
    }
    return true
  })

  // Pass B
  const draftedByLimit: number[] = []
  if (stillPublished.length > newPlan.maxOffers) {
    stillPublished.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const kept = stillPublished.slice(0, newPlan.maxOffers)
    const toDraft = stillPublished.slice(newPlan.maxOffers)
    toDraft.forEach(o => draftedByLimit.push(o.id))
    stillPublished = kept
  }

  if (!dryRun) {
    const toDraftAll = [...draftedByCategory, ...draftedByLimit]
    for (const id of toDraftAll) {
      await payload.update({
        collection: 'offers',
        id,
        data: { _status: 'draft' },
        context: { disableRevalidate: true },
      })
    }
  }

  return {
    draftedByCategory,
    draftedByLimit,
    keptPublished: stillPublished.map(o => o.id),
  }
}

async function resolveLevelByCategoryPath(
  payload: Payload,
  slugPaths: string[],
): Promise<Map<string, number>> {
  if (slugPaths.length === 0) return new Map()

  const topSlugs = Array.from(new Set(slugPaths.map(p => p.split('/')[0])))
  const cats = (await payload.find({
    collection: 'service-categories',
    where: { slug: { in: topSlugs } },
    limit: 0,
    depth: 1,
  })).docs as any[]

  const out = new Map<string, number>()
  for (const path of slugPaths) {
    const parts = path.split('/')
    const root = cats.find((c) => c.slug === parts[0])
    if (!root) continue
    const level = walkPath(root, parts.slice(1))
    if (level !== null) out.set(path, level)
  }
  return out
}

function walkPath(node: any, remainder: string[]): number | null {
  let current: any = node
  let bestLevel: number | null = readLevel(current)
  for (const slug of remainder) {
    const children = current.subcategory_level_1 ?? current.subcategory_level_2 ?? []
    const next = children.find((c: any) => c.slug === slug)
    if (!next) break
    const lvl = readLevel(next)
    if (lvl !== null) bestLevel = lvl
    current = next
  }
  return bestLevel
}

function readLevel(node: any): number | null {
  const rp = node?.requiredPlan
  if (!rp) return null
  if (typeof rp === 'object' && typeof rp.level === 'number') return rp.level
  return null
}
