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
      <div className="flex flex-col gap-10 lg:gap-16 w-full">
        <OfferDetails offer={data} />

        {/* Decorative accent divider */}
        <div className="flex items-center justify-center gap-3" aria-hidden="true">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          <div className="h-1.5 w-3 rounded-full bg-primary/25" />
          <div className="h-1.5 w-8 rounded-full bg-primary/40" />
          <div className="h-1.5 w-3 rounded-full bg-primary/25" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
        </div>

        <ContactInfo offer={data} />
      </div>
    </>
  )
}
