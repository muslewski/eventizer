'use client'
import { useState, useEffect } from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { OfferHero, OfferShortInfo, OfferVideo, OfferGallery, OfferDetails, ContactInfo } from './components'
import type { Offer } from '@/payload-types' // adjust import path
import { resolveCategoryIconUrl } from '@/actions/resolveCategoryIconUrl'

export const LivePreviewOffer: React.FC<{
  initialData: Offer
  initialCategoryIconUrl?: string | null
}> = ({ initialData, initialCategoryIconUrl }) => {
  const { data } = useLivePreview<Offer>({
    initialData,
    serverURL: process.env.NEXT_PUBLIC_PAYLOAD_SERVER_URL ?? 'http://localhost:3000',
    depth: 2,
  })

  const [categoryIconUrl, setCategoryIconUrl] = useState<string | null>(
    initialCategoryIconUrl ?? null,
  )

  // Re-resolve icon when category changes during live preview
  useEffect(() => {
    if (data.category) {
      resolveCategoryIconUrl(data.category).then((url) => setCategoryIconUrl(url))
    } else {
      setCategoryIconUrl(null)
    }
  }, [data.category])

  return (
    <>
      <OfferHero offer={data} />

      <div className="pt-16 flex flex-col gap-10 lg:gap-26 w-full">

      <OfferShortInfo offer={data} />
      <OfferGallery offer={data} />

      <OfferVideo offer={data} />
        <OfferDetails offer={data} categoryIconUrl={categoryIconUrl} />

     

        <ContactInfo offer={data} />
      </div>
    </>
  )
}
