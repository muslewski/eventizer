'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon } from 'lucide-react'

interface OfferMainImageCellClientProps {
  mainImageUrl: string | null
  bgImageUrl: string | null
  title: string
  price: string | null
  href?: string
}

function getInitials(title: string): string {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export function OfferMainImageCellClient({
  mainImageUrl,
  bgImageUrl,
  title,
  price,
  href,
}: OfferMainImageCellClientProps) {
  const [mainError, setMainError] = useState(false)
  const [bgError, setBgError] = useState(false)

  const showMain = mainImageUrl && !mainError
  const showBg = bgImageUrl && !bgError

  const Component = (href ? Link : 'div') as React.ElementType

  return (
    <div className="flex items-center py-1.5">
      {/* Wide card container */}
      <Component
        {...(href ? { href } : {})}
        className="relative w-52 h-16 rounded-lg overflow-hidden block transition-all duration-200 hover:ring-2 hover:ring-[var(--theme-elevation-300)] hover:scale-[1.02] active:scale-[0.98]"
        style={{
          border: '1.5px solid var(--theme-elevation-150)',
          background: 'var(--theme-elevation-100)',
          textDecoration: 'none',
        }}
      >
        {/* Background image - blurred & dimmed */}
        {showBg && (
          <Image
            src={bgImageUrl}
            alt=""
            fill
            sizes="208px"
            className="object-cover"
            style={{ filter: 'blur(1px) brightness(0.45)' }}
            onError={() => setBgError(true)}
          />
        )}
        {!showBg && (
          <div className="absolute inset-0" style={{ background: 'var(--theme-elevation-150)' }} />
        )}

        {/* Content overlay */}
        <div className="relative h-full flex items-center gap-3 px-2.5">
          {/* Circular main image */}
          <div
            className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden"
            style={{
              border: '2px solid rgba(255,255,255,0.7)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}
          >
            {showMain ? (
              <Image
                src={mainImageUrl}
                alt={title}
                fill
                sizes="44px"
                className="object-cover"
                onError={() => setMainError(true)}
              />
            ) : (
              <div
                className="h-full w-full flex items-center justify-center"
                style={{ background: 'var(--theme-elevation-200)' }}
              >
                {title ? (
                  <span
                    className="text-[10px] font-bold leading-none"
                    style={{ color: 'var(--theme-elevation-600)' }}
                  >
                    {getInitials(title)}
                  </span>
                ) : (
                  <ImageIcon size={14} style={{ color: 'var(--theme-elevation-400)' }} />
                )}
              </div>
            )}
          </div>

          {/* Price badge */}
          {price && (
            <span
              className="text-base font-bebas leading-tight truncate tracking-wide"
              style={{
                color: 'rgba(255,255,255,0.95)',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {price}
            </span>
          )}
        </div>
      </Component>
    </div>
  )
}
