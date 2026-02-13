'use client'

import { Offer, OfferUpload } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import Image from 'next/image'
import { Quote } from 'lucide-react'
import { TitleH3 } from '@/components/frontend/Content/TitleH3'
import { motion } from 'motion/react'

interface OfferShortInfoProps {
  offer: Offer
}

export const OfferShortInfo: React.FC<OfferShortInfoProps> = ({ offer }) => {
  const mainImage = isExpandedDoc<OfferUpload>(offer.mainImage) ? offer.mainImage : null

  // Don't render if there's no image and no short description
  if ((!mainImage || !mainImage.url) && !offer.shortDescription) return null

  return (
    <section className="py-16 flex flex-col justify-center sm:flex-row items-center gap-6 sm:gap-8 md:gap-12 mx-auto max-w-4xl">
      {/* Circle main image */}
      {mainImage && mainImage.url && (
        <motion.div
          className="relative shrink-0"
          initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{
            default: { duration: 0.9, ease: 'easeOut' },
            scale: { duration: 0.9, ease: 'easeOut' },
          }}
          whileHover={{
            scale: 1.1,
            rotate: -3,
            transition: { type: 'spring', stiffness: 300, damping: 12 },
          }}
          whileTap={{
            scale: 0.95,
            rotate: 2,
            transition: { type: 'spring', stiffness: 400, damping: 15 },
          }}
        >
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-60 md:h-60 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl shadow-primary/10 transition-shadow duration-300 hover:shadow-3xl hover:shadow-primary/20 hover:border-primary/40">
            <Image
              src={mainImage.url}
              alt={mainImage.title || offer.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 240px"
            />
          </div>
          {/* Decorative ring */}
          <div
            className="absolute -inset-2 rounded-full border-2 border-dashed border-primary/30 animate-spin-slow"
            style={{ animationDuration: '20s' }}
          />
        </motion.div>
      )}

      {/* Short description */}
      {offer.shortDescription && (
        <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col items-center sm:items-start mt-2 gap-4 relative">
          <div className="w-fit">
            <TitleH3 title="W skrócie" />
          </div>
          <div className="relative pl-4 sm:pl-5 border-l-2 border-primary/40">
            <Quote className="absolute -left-3 -top-1 size-5 sm:size-6 text-primary/30 fill-primary/10" />
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl break-words italic">
              {offer.shortDescription}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
