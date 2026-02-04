'use client'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { OfferHero, OfferDetails, ContactInfo } from './components'
import type { Offer } from '@/payload-types' // adjust import path

export const LivePreviewOffer: React.FC<{ initialData: Offer }> = ({ initialData }) => {
  const { data } = useLivePreview<Offer>({
    initialData,
    serverURL: process.env.NEXT_PUBLIC_PAYLOAD_SERVER_URL ?? 'http://localhost:3000',
    depth: 2,
  })

  return (
    <>
      <OfferHero offer={data} />
      <div className="flex flex-col gap-8 lg:gap-12 w-full">
        <OfferDetails offer={data} />
        <ContactInfo offer={data} />
      </div>
    </>
  )
}
