'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { navLinks } from '@/components/frontend/Header/shared'
import { ImageIcon, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Serialisable category shape passed from the server component. */
export interface NavCategory {
  name: string
  slug: string
  description: string | null
  iconUrl: string | null
}

interface NavigationLinksProps {
  normalizedPathname: string
  variant?: 'header' | 'sticky'
  categories: NavCategory[]
}

export default function NavigationLinks({
  normalizedPathname,
  variant = 'header',
  categories,
}: NavigationLinksProps) {
  const isHeader = variant === 'header'

  return (
    <NavigationMenu viewport={false} className="max-w-none">
      <NavigationMenuList className={cn(isHeader ? 'gap-10' : 'gap-6')}>
        {navLinks.map((link, index) => {
          const hasDropdown = link.href === '/ogloszenia'

          return (
            <React.Fragment key={link.href}>
              {isHeader && index > 0 && <HeaderDivider index={index} />}
              <NavigationMenuItem>
                {hasDropdown ? (
                  <>
                    <Button
                      variant="link"
                      asChild
                      className={cn(
                        'text-white/70 after:from-white after:to-white/50',
                        normalizedPathname === link.href && 'after:scale-x-100',
                      )}
                    >
                      <Link href={link.href} prefetch>
                        <NavigationMenuTrigger className="bg-transparent! hover:bg-transparent! focus:bg-transparent! data-[state=open]:bg-transparent! h-auto! rounded-none! px-0! py-0! shadow-none! focus-visible:ring-0! focus-visible:outline-none! cursor-pointer!  hover:text-white/70 focus:text-white/70 data-[state=open]:text-white/70">
                          {link.label}
                        </NavigationMenuTrigger>
                      </Link>
                    </Button>
                    <NavigationMenuContent className="border-border/50 bg-background text-foreground! shadow-lg! shadow-black/10! rounded-xl!">
                      <OgloszeniaDropdown categories={categories} />
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Button
                    variant="link"
                    asChild
                    className={cn(
                      'text-white/70 after:from-white after:to-white/50',
                      normalizedPathname === link.href && 'after:scale-x-100',
                    )}
                  >
                    <Link href={link.href} prefetch>
                      {link.label}
                    </Link>
                  </Button>
                )}
              </NavigationMenuItem>
            </React.Fragment>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

/* ── Header divider (main header only) ── */

function HeaderDivider({ index }: { index: number }) {
  return (
    <div
      className={cn(
        'h-16 w-px',
        index % 2 === 1
          ? 'bg-linear-to-t from-white/50 to-transparent'
          : 'bg-linear-to-b from-white/50 to-transparent',
      )}
    />
  )
}

/* ── Dropdown content for /ogloszenia with real categories ── */

function OgloszeniaDropdown({ categories }: { categories: NavCategory[] }) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const handleImageLoad = (slug: string) => {
    setLoadedImages((prev) => new Set(prev).add(slug))
  }

  if (categories.length === 0) {
    return <div className="w-80 p-4 text-center text-muted-foreground text-sm">Brak kategorii</div>
  }

  const maxVisible = 6
  const visible = categories.slice(0, maxVisible)
  const remaining = categories.length - maxVisible

  return (
    <div className="w-90 md:w-140 lg:w-160">
      {/* Header link */}
      <div className="px-2 pt-2 pb-1">
        <NavigationMenuLink asChild>
          <Link
            href="/ogloszenia#oferty"
            prefetch
            className="flex flex-row! items-center justify-center gap-2 rounded-lg p-2.5! text-sm font-medium text-muted-foreground transition-colors  hover:text-foreground!"
          >
            Przeglądaj wszystkie ogłoszenia
            <ArrowRight className="size-4" />
          </Link>
        </NavigationMenuLink>
        <div className="mt-1 h-px bg-border/50" />
      </div>

      {/* Categories grid */}
      <ul className="grid gap-1 p-2 md:grid-cols-2">
        {visible.map((cat) => (
          <li key={cat.slug}>
            <NavigationMenuLink asChild>
              <Link
                href={`/ogloszenia?kategoria=${cat.slug}#oferty`}
                prefetch
                className="flex flex-row! items-center gap-3 rounded-lg p-2.5! transition-colors hover:bg-accent! dark:hover:bg-accent/50! border hover:border-accent/30 shadow-sm focus:bg-accent!"
              >
                {/* Icon */}
                <div className="relative size-11 shrink-0 rounded-lg bg-muted/50 border border-border/50">
                  {cat.iconUrl ? (
                    <>
                      {!loadedImages.has(cat.slug) && (
                        <Skeleton className="absolute inset-0 rounded-lg flex items-center justify-center bg-muted/50!">
                          <ImageIcon className="size-5 text-muted-foreground/50 animate-pulse" />
                        </Skeleton>
                      )}
                      <Image
                        src={cat.iconUrl}
                        alt={cat.name}
                        fill
                        className={cn(
                          'object-contain p-1.5 transition-opacity duration-200 dark:invert',
                          !loadedImages.has(cat.slug) ? 'opacity-0' : 'opacity-100',
                        )}
                        onLoad={() => handleImageLoad(cat.slug)}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center size-full">
                      <ImageIcon className="size-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium leading-none text-foreground text-sm">
                    {cat.name}
                  </span>
                  {cat.description && (
                    <span className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                      {cat.description}
                    </span>
                  )}
                </div>
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>

      {/* "+X więcej" note */}
      {remaining > 0 && (
        <div className="px-2 pb-2">
          <div className="h-px bg-border/50 mb-1" />
          <NavigationMenuLink asChild>
            <Link
              href="/ogloszenia#oferty"
              prefetch
              className="flex items-center justify-center rounded-lg p-2! text-xs text-muted-foreground/70 transition-colors hover:bg-accent! hover:text-muted-foreground! focus:bg-accent!"
            >
              +{remaining} więcej
            </Link>
          </NavigationMenuLink>
        </div>
      )}
    </div>
  )
}
