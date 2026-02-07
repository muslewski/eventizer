import { EntityType, formatAdminURL } from '@payloadcms/ui/shared'
import { FC } from 'react'
import { getTranslation, I18nClient } from '@payloadcms/translations'
import { BasePayload, CollectionSlug, StaticLabel, User } from 'payload'

import { FeatureCard } from '../DashboardFeatureCard'
import { CustomCard } from '@/components/payload/customCard'

type Props = {
  adminRoute: string
  label: string
  i18n: I18nClient
  entities: {
    label: StaticLabel
    slug: string
    type: EntityType
  }[]
  payload: BasePayload
  isFeatured?: boolean
  user?: User | null
}

export const DashboardGroup: FC<Props> = async ({
  label: groupLabel,
  adminRoute,
  i18n,
  entities,
  payload,
  isFeatured = false,
  user,
}) => {
  const getCounts = async () => {
    const docCounts: Record<string, number> = {}
    for (let i = 0; i < entities.length; i++) {
      const slug = entities[i].slug as CollectionSlug
      const { totalDocs } = await payload.count({
        collection: slug,
        user,
        overrideAccess: false, // CRITICAL: Respect access control
      })
      docCounts[slug] = totalDocs
    }
    return docCounts
  }

  let counts: Record<string, number> = {}

  if (isFeatured) {
    counts = await getCounts()
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-(--theme-elevation-500) m-0">
        {groupLabel}
      </p>
      <ul
        className={`p-0 m-0 list-none ${
          isFeatured
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
            : 'flex flex-wrap gap-2'
        }`}
      >
        {entities.map(({ slug, type, label }, entityIndex) => (
          <li key={entityIndex}>
            {isFeatured ? (
              <FeatureCard
                title={getTranslation(label, i18n)}
                href={formatAdminURL({
                  adminRoute,
                  path:
                    type === EntityType.collection ? `/collections/${slug}` : `/globals/${slug}`,
                })}
                slug={slug}
                count={counts[slug] ?? 0}
              />
            ) : (
              <CustomCard
                title={getTranslation(label, i18n)}
                slug={slug}
                href={formatAdminURL({
                  adminRoute,
                  path:
                    type === EntityType.collection ? `/collections/${slug}` : `/globals/${slug}`,
                })}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
