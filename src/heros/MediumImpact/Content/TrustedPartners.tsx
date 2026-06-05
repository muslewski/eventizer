import { getPayload } from 'payload'
import config from '@payload-config'
import Image from 'next/image'
import BlurText from '@/components/react-bits/BlurText'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { cn } from '@/lib/utils'
import type { Media, Partner } from '@/payload-types'

const logoUrl = (partner: Partner): string | null => {
  if (!partner.logo) return null
  if (isExpandedDoc<Media>(partner.logo)) return partner.logo.url ?? null
  return null
}

export const TrustedPartners = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'partners',
    where: {
      showOnSignIn: { equals: true },
      logo: { exists: true },
    },
    sort: '_order',
    limit: 4,
    depth: 1,
  })

  const partners = docs
    .map((partner) => ({ partner, url: logoUrl(partner) }))
    .filter((entry): entry is { partner: Partner; url: string } => Boolean(entry.url))

  if (partners.length === 0) return null

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 2xl:gap-12">
      <h3 className="xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas max-w-7xl text-white dark:mix-blend-difference transform-gpu">
        <BlurText
          text="Zaufali nam najlepsi"
          animateBy="letters"
          direction="bottom"
          delay={50}
          startDelay={250}
        />
      </h3>

      <div className="flex">
        {partners.map(({ partner, url }, index) => (
          <div
            key={partner.id}
            className={cn(
              'size-16 md:size-24 rounded-full overflow-hidden bg-white ring-1 ring-white/20 flex items-center justify-center',
              index > 0 && '-ml-4 md:-ml-6',
            )}
          >
            <Image
              src={url}
              alt={`${partner.name} logo`}
              width={96}
              height={96}
              className="size-full object-contain p-2"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
