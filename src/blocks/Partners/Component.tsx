import { PartnersClient } from '@/blocks/Partners/Component.client'
import { resolvePartners } from '@/blocks/Partners/shared'
import type { PartnersBlock as PartnersBlockProps } from '@/payload-types'

export const PartnersBlock: React.FC<
  PartnersBlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ badge, heading, description, rotationSeconds, partners, className }) => {
  const resolved = await resolvePartners(partners ?? [])

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
