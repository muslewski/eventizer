// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

/**
 * Makes the o-nas page's partners carousel show the SAME partners as the home
 * page: copies the home `partnersV2` block's partner selection (order included)
 * into o-nas's `partnersV2` block. o-nas had carried over a smaller 6-partner
 * subset from its old v1 block.
 *
 * Idempotent — skips if o-nas already matches home, or if either block/list is
 * missing/empty. Local API; registered in ALWAYS_RUN.
 */
function blockPartnerIds(b: any): number[] {
  return (Array.isArray(b?.partners) ? b.partners : []).map((x: any) =>
    x && typeof x === 'object' ? (x.id ?? x.value) : x,
  )
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const home = (
    await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
  ).docs[0]
  const onas = (
    await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'o-nas' } },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
  ).docs[0]
  if (!home || !onas) {
    payload.logger.info('[sync-onas] home or o-nas page not found — skip')
    return
  }

  const homeBlock = (Array.isArray(home.layout) ? home.layout : []).find(
    (b) => b?.blockType === 'partnersV2',
  )
  const homeIds = homeBlock ? blockPartnerIds(homeBlock) : []
  if (homeIds.length === 0) {
    payload.logger.info('[sync-onas] home has no partnersV2 partners — skip (no overwrite)')
    return
  }

  let changed = false
  const newLayout = (Array.isArray(onas.layout) ? onas.layout : []).map((b) => {
    if (b?.blockType !== 'partnersV2') return b
    const cur = blockPartnerIds(b)
    const same = cur.length === homeIds.length && cur.every((v, i) => v === homeIds[i])
    if (same) return b
    changed = true
    return { ...b, partners: homeIds }
  })

  if (changed) {
    await payload.update({
      collection: 'pages',
      id: onas.id,
      data: { layout: newLayout },
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    payload.logger.info(`[sync-onas] o-nas partnersV2 set to ${homeIds.length} partners (matched home)`)
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-restoring: the previous o-nas subset is lossy. Re-curate in the CMS if needed.
}
