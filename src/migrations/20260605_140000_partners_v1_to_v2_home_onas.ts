// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

/**
 * Switches the `home` and `o-nas` pages from the legacy v1 `partners` block
 * (inline partner array — duplicate enum colors, no logos) to the collection-
 * backed `partnersV2` block, so the carousel renders the partners collection's
 * unique hex palette + uploaded logos (single source of truth).
 *
 * Carries over the v1 block's badge/heading/description/rotationSeconds verbatim
 * and maps the inline partner order → collection partner ids by name. Fail-safe:
 * if any inline partner name doesn't resolve to a collection partner, that page
 * is left untouched. Idempotent — a page with no v1 `partners` block is skipped.
 *
 * Uses the Payload local API (same pattern as 20260603_120500_seed_partners) so
 * all the block/relationship table plumbing is handled correctly. Runs before
 * `next build` prerenders, so the new layout is in the deployed HTML.
 * Registered in ALWAYS_RUN (scripts/prepare-migrations.mjs).
 */
const TARGET_SLUGS = ['home', 'o-nas']

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs: partners } = await payload.find({
    collection: 'partners',
    limit: 1000,
    depth: 0,
    req,
    overrideAccess: true,
  })
  const idByName = new Map<string, number>(partners.map((p) => [p.name, p.id]))

  for (const slug of TARGET_SLUGS) {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
    const page = docs[0]
    if (!page) {
      payload.logger.info(`[v1->v2] page "${slug}" not found — skip`)
      continue
    }

    const layout = Array.isArray(page.layout) ? page.layout : []
    if (!layout.some((b) => b?.blockType === 'partners')) {
      payload.logger.info(`[v1->v2] page "${slug}" has no v1 partners block — skip`)
      continue
    }

    let aborted = false
    const newLayout = layout.map((b) => {
      if (b?.blockType !== 'partners') return b
      const inline = Array.isArray(b.partners) ? b.partners : []
      const ids: number[] = []
      for (const p of inline) {
        const id = idByName.get(p?.name)
        if (id == null) {
          aborted = true
          payload.logger.error(`[v1->v2] ${slug}: no collection partner for "${p?.name}" — aborting page`)
          break
        }
        ids.push(id)
      }
      if (aborted) return b
      return {
        blockType: 'partnersV2',
        badge: b.badge,
        heading: b.heading,
        description: b.description,
        rotationSeconds: b.rotationSeconds,
        partners: ids,
      }
    })

    if (aborted) continue

    await payload.update({
      collection: 'pages',
      id: page.id,
      data: { layout: newLayout },
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    payload.logger.info(`[v1->v2] page "${slug}" → partnersV2`)
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Non-restoring: rebuilding the exact v1 inline array (quotes, links, colors)
  // is lossy. Re-add a v1 block manually in the CMS if a rollback is ever needed.
}
