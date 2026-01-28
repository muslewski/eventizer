'use client'

import { useRef, useState, useCallback } from 'react'
import { PaginationInfo } from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import { OfferListCard } from '@/app/(frontend)/[lang]/ogloszenia/ListView/OffersView/OfferListCard'
import PaginationControls from '@/app/(frontend)/[lang]/ogloszenia/ListView/PaginationControls'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import type { Offer, OfferUpload } from '@/payload-types'
import { cn } from '@/lib/utils'
import { motion, type Transition } from 'framer-motion'

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    } as Transition,
  },
}

export default function OffersView({
  offers,
  pagination,
  pathname,
}: {
  offers: Offer[] | null
  pagination: PaginationInfo
  pathname: string
}) {
  const [isAtTop, setIsAtTop] = useState(true)
  const [isAtBottom, setIsAtBottom] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null!)

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const { scrollTop, scrollHeight, clientHeight } = viewport
    const threshold = 10 // pixels threshold for edge detection

    setIsAtTop(scrollTop <= threshold)
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - threshold)
  }, [])

  return (
    <div className="relative w-full h-[calc(100%-90px)]">
      <ScrollArea
        className="w-full h-full overflow-hidden"
        type="always"
        viewportRef={viewportRef}
        onScrollCapture={handleScroll}
      >
        <div className="flex flex-col gap-6 items-center w-full sm:pr-6">
          {/* Map offers */}
          {offers && offers.length > 0 ? (
            offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }} // Staggered animation
                className="w-full"
              >
                <OfferListCard
                  imageUrl={
                    isExpandedDoc<OfferUpload>(offer.mainImage)
                      ? (offer.mainImage?.url ?? undefined)
                      : undefined
                  }
                  title={offer.title}
                  description={offer.shortDescription}
                  rating={4.5}
                  reviewCount={27}
                  priceMin={offer.priceFrom || 0}
                  priceMax={offer.priceTo || 0}
                  price={offer.price || undefined}
                  hasPriceRange={offer.hasPriceRange || undefined}
                />
              </motion.div>
            ))
          ) : (
            <p>{'Brak dostępnych ofert.'}</p>
          )}

          {/* Pagination controls */}
          <PaginationControls pagination={pagination} pathname={pathname} />
        </div>
      </ScrollArea>

      {/* Top fade overlay */}
      <div
        className={cn(
          'pointer-events-none hidden md:block absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent transition-opacity duration-300',
          isAtTop ? 'opacity-0' : 'opacity-100',
        )}
      />

      {/* Bottom fade overlay */}
      <div
        className={cn(
          'pointer-events-none hidden md:block absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent transition-opacity duration-300',
          isAtBottom ? 'opacity-0' : 'opacity-100',
        )}
      />
    </div>
  )
}
