import { PartnersClient } from '@/blocks/Partners/Component.client'
import { resolvePartners } from '@/blocks/Partners/shared'
import type { Partner, PartnersV2Block as PartnersV2BlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export const PartnersV2Block: React.FC<
  PartnersV2BlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ badge, heading, description, rotationSeconds, partners, className }) => {
  // The relationship may arrive as ids or expanded docs.
  const partnerIds = (partners ?? [])
    .map((p) => (typeof p === 'object' ? p.id : p))
    .filter((id): id is number => typeof id === 'number')

  if (partnerIds.length === 0) return null

  // Re-fetch the picked partners fresh (depth 1 populates the logo upload) so
  // edits in the collection appear even on statically-cached pages.
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'partners',
    where: { id: { in: partnerIds } },
    limit: partnerIds.length,
    depth: 1,
  })

  // Preserve the editor's chosen order.
  const ordered = partnerIds
    .map((id) => docs.find((d) => d.id === id))
    .filter((d): d is Partner => d != null)

  if (ordered.length === 0) return null

  const resolved = await resolvePartners(ordered)

  return (
    <PartnersClient
      badge={badge}
      heading={heading}
      description={description ?? undefined}
      rotationSeconds={rotationSeconds ?? undefined}
      partners={resolved}
      className={className}
    />
  )
}
