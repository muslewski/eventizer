'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import BlurText from '@/components/react-bits/BlurText'
import { Progress } from '@/components/ui/progress'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'

interface BreadcrumbSegment {
  label: string
  href?: string
}

interface PanelPageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbSegment[]
  lang: string
  action?: React.ReactNode
  backgroundImageUrl?: string | null
  progress?: { value: number; label?: string }
}

export function PanelPageHeader({
  title,
  description,
  breadcrumbs,
  lang,
  action,
  backgroundImageUrl,
  progress,
}: PanelPageHeaderProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-2xl" data-theme="dark">
      {/* Background image */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 z-0 animate-zoom-in will-change-transform transform-gpu backface-hidden"
          style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}
        >
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            quality={70}
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 80vw"
            onLoad={() => setIsLoaded(true)}
          />
          <div
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 4px 40px rgba(0, 0, 0, 0.5)' }}
          />
        </div>
      )}

      {/* Fallback gradient when no image */}
      {!backgroundImageUrl && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/10 via-background to-background" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-transparent via-black/30 to-black/70" />

      {/* Noise texture */}
      <div className="absolute inset-0 z-2 opacity-[0.12] mix-blend-hard-light pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Accent glow */}
      <div className="absolute -bottom-6 -left-6 z-1 size-24 rounded-full bg-accent/10 blur-[50px]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-5 py-4 sm:px-6 sm:py-5">
        {/* Top row: breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${lang}/panel/dashboard`} className="text-white/40 hover:text-white/60 text-xs">
                    Panel
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((segment) => (
                <span key={segment.label} className="contents">
                  <BreadcrumbSeparator className="text-white/20" />
                  <BreadcrumbItem>
                    {segment.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={`/${lang}${segment.href}`} className="text-white/40 hover:text-white/60 text-xs">
                          {segment.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-white/60 text-xs">{segment.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Bottom section: title + progress */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <BlurText
                text={title}
                className="font-bebas text-3xl sm:text-4xl tracking-wide text-white"
                delay={80}
                animateBy="words"
              />
              {description && (
                <p className="text-xs sm:text-sm text-white/40">{description}</p>
              )}
            </div>
            {action && (
              <div className="shrink-0">{action}</div>
            )}
          </div>
          {progress && (
            <div className="flex flex-col gap-1.5">
              <Progress value={progress.value} className="h-1.5 bg-white/10 [&>[data-slot=progress-indicator]]:bg-accent" />
              {progress.label && (
                <p className="text-xs text-white/40">{progress.label}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
