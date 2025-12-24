'use client'

import { useConfig, useTranslation } from '@payloadcms/ui'
import { getTranslation } from '@payloadcms/translations'
import { useParams } from 'next/navigation'

import './index.scss'

const baseClass = 'list-banner'

export const ListBanner = () => {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const params = useParams()

  // Get collection slug from URL params
  const collectionSlug = params.segments?.[1] as string

  // Find the collection config
  const collection = config.collections?.find((c) => c.slug === collectionSlug)

  if (!collection) return null

  const label = getTranslation(collection.labels?.plural || collection.slug, i18n)

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__content`}>
          {/* Decorative golden element */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-500" />
            <span className="text-amber-500 text-xs font-semibold uppercase tracking-[0.2em]">
              Kolekcja
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-500" />
          </div>

          <h1
            className="text-4xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent"
            style={{ fontFamily: 'Bebas Neue' }}
          >
            {label}
          </h1>

          {/* Bottom decorative accent */}
          <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-amber-500 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  )
}
