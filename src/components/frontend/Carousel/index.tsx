'use client'

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
import SlideIndicators from '@/components/frontend/Carousel/SlideIndicators'
import CarouselCard, { type CarouselSlide } from '@/components/frontend/Carousel/CarouselCard'
import GradualBlurMemo from '@/components/react-bits/GradualBlur'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type { CarouselSlide }

const DEFAULT_AUTOPLAY_DELAY = 3300

interface ImageCarouselProps {
  slides: CarouselSlide[]
  /** Autoplay delay in ms. Defaults to 3300. Set to 0 to disable autoplay. */
  autoplayDelay?: number
  /** Accessible label for the carousel region */
  ariaLabel?: string
  /** Additional class names for the outer wrapper */
  className?: string
  /** When true, clicking a card opens the image in a lightbox dialog */
  lightbox?: boolean
}

export default function ImageCarousel({
  slides,
  autoplayDelay = DEFAULT_AUTOPLAY_DELAY,
  ariaLabel = 'Image carousel',
  className,
  lightbox = false,
}: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const useAutoplay = autoplayDelay > 0

  const autoplayPlugin = useMemo(
    () =>
      useAutoplay
        ? Autoplay({
            delay: autoplayDelay,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          })
        : null,
    [autoplayDelay, useAutoplay],
  )

  const stopProgressAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  const updateProgress = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current
    const progressValue = Math.min((elapsed / autoplayDelay) * 100, 100)
    setProgress(progressValue)

    if (progressValue < 100) {
      animationRef.current = requestAnimationFrame(updateProgress)
    }
  }, [autoplayDelay])

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
      if (autoplayPlugin?.isPlaying?.()) {
        startProgressAnimation()
      }
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

    if (useAutoplay) {
      api.on('autoplay:timerset', onTimerSet)
      api.on('autoplay:timerstopped', onTimerStopped)
    }

    // Initialize
    onSelect()
    if (autoplayPlugin?.isPlaying?.()) {
      setIsPlaying(true)
      startProgressAnimation()
    }

    return () => {
      api.off('select', onSelect)
      if (useAutoplay) {
        api.off('autoplay:timerset', onTimerSet)
        api.off('autoplay:timerstopped', onTimerStopped)
      }
      stopProgressAnimation()
    }
  }, [api, autoplayPlugin, useAutoplay, startProgressAnimation, stopProgressAnimation])

  // Pause on page visibility change
  useEffect(() => {
    if (!autoplayPlugin) return

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

  if (slides.length === 0) return null

  const lightboxDialog = lightbox && lightboxIndex !== null && (
    <Dialog open onOpenChange={() => setLightboxIndex(null)}>
      <DialogContent
        className="sm:max-w-[100vw] max-w-[100vw] w-screen h-screen max-h-screen p-0 pt-12 bg-background border-none rounded-none flex flex-col items-center justify-center gap-0"
        showCloseButton
      >
        <VisuallyHidden>
          <DialogTitle>{slides[lightboxIndex]?.imageAlt}</DialogTitle>
          <DialogDescription>Image preview</DialogDescription>
        </VisuallyHidden>

        {/* Main image area */}
        <div className="relative w-full flex-1 min-h-0">
          <Image
            src={slides[lightboxIndex]!.imageUrl}
            alt={slides[lightboxIndex]!.imageAlt}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />

          {/* Navigation arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={() => setLightboxIndex((lightboxIndex - 1 + slides.length) % slides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                onClick={() => setLightboxIndex((lightboxIndex + 1) % slides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>

        {/* Bottom bar: slide counter + label + indicators */}
        <div className="w-full flex flex-col items-center gap-2 py-4 px-4 bg-background">
          {slides[lightboxIndex]?.label && (
            <p className="text-foreground text-sm sm:text-base font-medium text-center">
              {slides[lightboxIndex].label}
            </p>
          )}
          {slides.length > 1 && (
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    'rounded-full transition-all duration-200',
                    i === lightboxIndex
                      ? 'w-6 h-2 bg-primary'
                      : 'w-2 h-2 bg-foreground/20 hover:bg-foreground/30',
                  )}
                />
              ))}
            </div>
          )}
          <span className="text-muted-foreground text-xs">
            {lightboxIndex + 1} / {slides.length}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )

  const handleSlideClick = lightbox ? (index: number) => setLightboxIndex(index) : undefined

  // Static grid for 3 or fewer slides — no carousel logic needed
  if (slides.length <= 3) {
    return (
      <>
        <div
          className={
            className ??
            'w-full sm:w-5/6 mx-auto grid gap-4 sm:gap-6 ' +
              (slides.length === 1
                ? 'grid-cols-1 max-w-md'
                : slides.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')
          }
          aria-label={ariaLabel}
        >
          {slides.map((slide, index) => (
            <CarouselCard
              key={slide.id}
              slide={slide}
              isActive={true}
              onClick={handleSlideClick ? () => handleSlideClick(index) : undefined}
            />
          ))}
        </div>
        {lightboxDialog}
      </>
    )
  }

  return (
    <Carousel
      setApi={setApi}
      className={className ?? 'w-full sm:w-5/6 select-none cursor-grab active:cursor-grabbing'}
      opts={{
        loop: true,
        align: 'center',
      }}
      plugins={autoplayPlugin ? [autoplayPlugin] : []}
      aria-label={ariaLabel}
    >
      {/* Gradual blur edges */}
      <div className="absolute -top-4 left-0 right-0 bottom-4 sm:rounded-4xl overflow-hidden to-transparent z-10 pointer-events-none">
        <GradualBlurMemo
          preset="left"
          exponential
          strength={3}
          zIndex={10}
          width="48px"
          mobileWidth="32px"
        />
        <GradualBlurMemo
          preset="right"
          exponential
          strength={3}
          zIndex={10}
          width="48px"
          mobileWidth="32px"
        />
      </div>

      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={slide.id} className="basis-3/4 md:basis-1/2 lg:basis-1/3">
            <CarouselCard
              slide={slide}
              isActive={current === index}
              onClick={handleSlideClick ? () => handleSlideClick(index) : undefined}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />

      <SlideIndicators
        total={slides.length}
        current={current}
        onSelect={handleSelect}
        progress={progress}
        isPlaying={isPlaying}
      />

      {lightboxDialog}
    </Carousel>
  )
}
