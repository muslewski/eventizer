'use client'

import { cn } from '@/lib/utils'
import { memo, useMemo, useEffect, useState } from 'react'

interface SlideIndicatorsProps {
  total: number
  current: number
  onSelect: (index: number) => void
  progress: number
  isPlaying: boolean
}

interface IndicatorProps {
  index: number
  isCurrent: boolean
  progress: number
  isPlaying: boolean
  onSelect: (index: number) => void
  isSafari: boolean
}

const Indicator = memo(function Indicator({
  index,
  isCurrent,
  progress,
  isPlaying,
  onSelect,
  isSafari,
}: IndicatorProps) {
  return (
    <button
      onClick={() => onSelect(index)}
      role="tab"
      aria-selected={isCurrent}
      aria-label={`Go to slide ${index + 1}`}
      className={cn(
        'relative h-1.5 sm:h-2.5 rounded-full transition-all duration-300 overflow-hidden',
        isCurrent
          ? 'w-8 sm:w-12 bg-foreground/20'
          : 'w-2 sm:w-4 bg-foreground/10 hover:bg-foreground/20',
        // On Safari, show solid fill for current indicator
        isCurrent && isSafari && 'bg-foreground/40',
      )}
    >
      {/* Skip progress animation on Safari */}
      {isCurrent && !isSafari && (
        <div
          className="absolute inset-0 bg-foreground rounded-full origin-left will-change-transform"
          style={{
            transform: `scaleX(${isPlaying ? progress / 100 : 0})`,
            transition: 'transform 100ms linear',
          }}
        />
      )}
    </button>
  )
})

export default function SlideIndicators({
  total,
  current,
  onSelect,
  progress,
  isPlaying,
}: SlideIndicatorsProps) {
  const indices = useMemo(() => Array.from({ length: total }, (_, i) => i), [total])
  const [isSafari, setIsSafari] = useState(false)

  useEffect(() => {
    // Detect Safari browser
    const isSafariBrowser =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'))
    setIsSafari(isSafariBrowser)
  }, [])

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3 mt-6"
      role="tablist"
      aria-label="Carousel navigation"
    >
      {indices.map((index) => (
        <Indicator
          key={index}
          index={index}
          isCurrent={current === index}
          progress={current === index ? progress : 0}
          isPlaying={current === index && isPlaying}
          onSelect={onSelect}
          isSafari={isSafari}
        />
      ))}
    </div>
  )
}
