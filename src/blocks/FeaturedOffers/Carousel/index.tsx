'use client'

import { Offer } from '@/payload-types'

import Autoplay from 'embla-carousel-autoplay'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SlideIndicators from '@/blocks/FeaturedOffers/Carousel/SlideIndicators'
import OfferCarouselCard from '@/blocks/FeaturedOffers/Carousel/OfferCard'

const AUTOPLAY_DELAY = 3300

export default function OffersCarousel({ offers }: { offers: Offer[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: AUTOPLAY_DELAY,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [],
  )

  const stopProgressAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const updateProgress = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current
    const progressValue = Math.min((elapsed / AUTOPLAY_DELAY) * 100, 100)
    setProgress(progressValue)

    if (progressValue < 100) {
      animationRef.current = requestAnimationFrame(updateProgress)
    }
  }, [])

  const startProgressAnimation = useCallback(() => {
    stopProgressAnimation()
    startTimeRef.current = performance.now()
    setProgress(0)
    animationRef.current = requestAnimationFrame(updateProgress)
  }, [stopProgressAnimation, updateProgress])

  const handleSelect = useCallback(
    (index: number) => {
      api?.scrollTo(index)
    },
    [api],
  )

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    const onTimerSet = () => {
      setIsPlaying(true)
      startProgressAnimation()
    }

    const onTimerStopped = () => {
      setIsPlaying(false)
      stopProgressAnimation()
    }

    api.on('select', onSelect)
    api.on('autoplay:timerset', onTimerSet)
    api.on('autoplay:timerstopped', onTimerStopped)

    // Initialize
    onSelect()
    if (autoplayPlugin.isPlaying?.()) {
      setIsPlaying(true)
      startProgressAnimation()
    }

    return () => {
      api.off('select', onSelect)
      api.off('autoplay:timerset', onTimerSet)
      api.off('autoplay:timerstopped', onTimerStopped)
      stopProgressAnimation()
    }
  }, [api, autoplayPlugin, startProgressAnimation, stopProgressAnimation])

  // Pause on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        autoplayPlugin.stop()
      } else {
        autoplayPlugin.play()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [autoplayPlugin])

  return (
    <Carousel
      setApi={setApi}
      className="w-full sm:w-5/6 select-none cursor-grab active:cursor-grabbing"
      opts={{
        loop: true,
        align: 'center',
      }}
      plugins={[autoplayPlugin]}
      aria-label="Featured offers carousel"
    >
      {/* Left fade gradient */}
      <div className="absolute -left-px top-0 bottom-0 w-16 md:w-32 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
      {/* Right fade gradient */}
      <div className="absolute -right-px top-0 bottom-0 w-16 md:w-32 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />
      <CarouselContent>
        {offers.map((offer, index) => (
          <CarouselItem
            key={offer.id}
            className="basis-3/4 md:basis-1/2 lg:basis-1/3 2xl:basis-1/4"
          >
            <OfferCarouselCard offer={offer} isActive={current === index} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />

      {/* Slide indicators */}
      <SlideIndicators
        total={offers.length}
        current={current}
        onSelect={handleSelect}
        progress={progress}
        isPlaying={isPlaying}
      />
    </Carousel>
  )
}
