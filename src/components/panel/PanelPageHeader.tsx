'use client'

import Link from 'next/link'
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
}

export function PanelPageHeader({
  title,
  description,
  breadcrumbs,
  lang,
  action,
}: PanelPageHeaderProps) {
  return (
    <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-2xl" data-theme="dark">
      {/* Gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/10 via-background to-background" />

      {/* Noise texture */}
      <div className="absolute inset-0 z-1 opacity-[0.12] mix-blend-hard-light pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

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

        {/* Bottom row: title + description + action */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-bebas text-2xl sm:text-3xl tracking-wide text-white">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-white/40">{description}</p>
            )}
          </div>
          {action && (
            <div className="shrink-0">{action}</div>
          )}
        </div>
      </div>
    </div>
  )
}
