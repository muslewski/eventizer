// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

/**
 * Adds the partner "Powód do uśmiechu" (flowers, bouquets & personalized gifts)
 * to the partners collection — wired to its Eventizer offer by stable `link`
 * slug — and appends it to the home page's partnersV2 carousel.
 *
 * Idempotent: the partner is created only if absent (by name), and appended only
 * if not already in the block. Uses the Payload local API (same pattern as
 * 20260603_120500_seed_partners). Registered in ALWAYS_RUN.
 */
const NAME = 'Powód do uśmiechu'
const OFFER_LINK = 'Powod-do-usmiechu-kwiaty-bukiety-i-personalizowane-prezenty'
const ACCENT = '#EF4444'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Ensure the partner exists.
  let partner = (
    await payload.find({
      collection: 'partners',
      where: { name: { equals: NAME } },
      limit: 1,
      req,
      overrideAccess: true,
    })
  ).docs[0]

  if (!partner) {
    const offerDocs = await payload.find({
      collection: 'offers',
      where: { link: { equals: OFFER_LINK } },
      limit: 1,
      req,
      overrideAccess: true,
    })
    const offer = offerDocs.docs[0]?.id ?? null
    if (!offer) {
      payload.logger.info(`[add-partner] offer "${OFFER_LINK}" not found — ${NAME} created without link`)
    }
    partner = await payload.create({
      collection: 'partners',
      data: {
        name: NAME,
        tagline: 'Kwiaty, bukiety i personalizowane prezenty',
        accentColor: ACCENT,
        offer,
      },
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    payload.logger.info(`[add-partner] created "${NAME}" (#${partner.id})`)
  }

  // 2. Append to the home page's partnersV2 carousel (if not already there).
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
  if (!home) {
    payload.logger.info('[add-partner] home page not found — partner created but not placed')
    return
  }

  const layout = Array.isArray(home.layout) ? home.layout : []
  let changed = false
  const newLayout = layout.map((b) => {
    if (b?.blockType !== 'partnersV2') return b
    const ids = (Array.isArray(b.partners) ? b.partners : []).map((x) =>
      x && typeof x === 'object' ? (x.id ?? x.value) : x,
    )
    if (ids.includes(partner.id)) return b
    changed = true
    return { ...b, partners: [...ids, partner.id] }
  })

  if (changed) {
    await payload.update({
      collection: 'pages',
      id: home.id,
      data: { layout: newLayout },
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    payload.logger.info(`[add-partner] appended #${partner.id} to home partnersV2`)
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  // Remove from the home partnersV2 block, then delete the partner.
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
  const partner = (
    await payload.find({
      collection: 'partners',
      where: { name: { equals: NAME } },
      limit: 1,
      req,
      overrideAccess: true,
    })
  ).docs[0]

  if (home && partner) {
    const layout = Array.isArray(home.layout) ? home.layout : []
    const newLayout = layout.map((b) => {
      if (b?.blockType !== 'partnersV2') return b
      const ids = (Array.isArray(b.partners) ? b.partners : [])
        .map((x) => (x && typeof x === 'object' ? (x.id ?? x.value) : x))
        .filter((id) => id !== partner.id)
      return { ...b, partners: ids }
    })
    await payload.update({
      collection: 'pages',
      id: home.id,
      data: { layout: newLayout },
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
  if (partner) {
    await payload.delete({
      collection: 'partners',
      id: partner.id,
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
}
