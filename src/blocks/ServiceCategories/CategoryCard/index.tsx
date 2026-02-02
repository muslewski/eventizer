'use client'

import { ServiceCategory, Media } from '@/payload-types'
import Image from 'next/image'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageIcon } from 'lucide-react'

interface CategoryCardProps {
  category: ServiceCategory
  onClick: () => void
  index: number
  total: number
}

/**
 * Interpolates between two colors based on a ratio (0 to 1)
 * Returns an HSL color string
 */
function interpolateColor(ratio: number, darker: boolean = false): string {
  // Start color: pinkish purple (hsl ~300)
  // End color: bluish cyan (hsl ~180)
  const startHue = 270 // pinkish purple
  const endHue = 200 // bluish cyan

  const hue = startHue + (endHue - startHue) * ratio
  const saturation = 70 // vibrant but not too intense
  const lightness = darker ? 10 : 60 // darker for card border, lighter for icon

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick, index, total }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const getIconUrl = (icon: (number | null) | Media | undefined): string | null => {
    if (!icon || typeof icon === 'number') return null
    return icon.url || null
  }

  const iconUrl = getIconUrl(category.icon)

  // Calculate gradient position (0 to 1)
  const ratio = total > 1 ? index / (total - 1) : 0
  const borderColor = interpolateColor(ratio, true) // darker for card border
  const iconBorderColor = interpolateColor(ratio) // lighter for icon

  return (
    <button
      onClick={onClick}
      style={
        {
          '--card-border-color': borderColor,
          borderColor: borderColor,
        } as React.CSSProperties
      }
      className="group flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl border-2 bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-lg hover:shadow-[var(--card-border-color)]/20 transition-all duration-300 cursor-pointer"
    >
      {/* Icon container */}
      <div
        style={{ borderColor: iconBorderColor }}
        className="relative size-12 sm:size-20 rounded-xl bg-muted/50 p-2 sm:p-3 border-2 transition-all duration-300"
      >
        {iconUrl ? (
          <>
            {!isImageLoaded && (
              <Skeleton className="absolute inset-0 rounded-lg flex items-center justify-center">
                <ImageIcon className="size-4 sm:size-6 text-muted-foreground/50 animate-pulse" />
              </Skeleton>
            )}
            <Image
              src={iconUrl}
              alt={category.name}
              fill
              className={`object-contain p-1 sm:p-4 dark:invert group-hover:scale-110 transition-transform duration-300 ${!isImageLoaded ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-muted-foreground">
              {category.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Category name */}
      <span className="text-sm sm:text-base font-medium text-center line-clamp-2 transition-colors duration-300">
        {category.name}
      </span>

      {/* Subcategory count indicator */}
      {category.subcategory_level_1 && category.subcategory_level_1.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {category.subcategory_level_1.length} podkategorii
        </span>
      )}
    </button>
  )
}
