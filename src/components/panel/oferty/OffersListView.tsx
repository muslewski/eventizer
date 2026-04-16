'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PlusIcon, FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnimatedCardGrid, AnimatedCard } from '@/components/panel/AnimatedCards'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { OfferCard } from '@/components/panel/oferty/OfferCard'
import { OfferStatusFilter } from '@/components/panel/oferty/OfferStatusFilter'
import type { Offer } from '@/payload-types'
import { cn } from '@/lib/utils'

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface OffersListViewProps {
  offers: Offer[]
  maxOffers: number
  lang: string
  pagination?: PaginationInfo
  currentFilter?: string
}

export function OffersListView({
  offers,
  maxOffers,
  lang,
  pagination,
  currentFilter,
}: OffersListViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const atLimit = pagination ? pagination.totalDocs >= maxOffers : offers.length >= maxOffers

  const buildUrl = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    }
    return `${pathname}?${newParams.toString()}`
  }

  const handleFilterChange = (value: string) => {
    startTransition(() => {
      router.push(buildUrl({
        filtr: value === 'all' ? undefined : value,
        strona: undefined, // reset to page 1
      }), { scroll: false })
    })
  }

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(buildUrl({
        strona: page <= 1 ? undefined : String(page),
      }), { scroll: false })
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (offers.length === 0 && !currentFilter) {
    return (
      <Empty className="min-h-[50svh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>Nie masz jeszcze żadnych ofert</EmptyTitle>
          <EmptyDescription>Dodaj swoją pierwszą ofertę.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href={`/${lang}/panel/oferty/nowa`}>
              <PlusIcon data-icon="inline-start" />
              Dodaj ofertę
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  // Generate page numbers
  const getPageNumbers = () => {
    if (!pagination || pagination.totalPages <= 1) return []
    const { currentPage, totalPages } = pagination
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className={cn('flex flex-col gap-6', isPending && 'opacity-60 transition-opacity')}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {atLimit ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled>
                    <PlusIcon data-icon="inline-start" />
                    Dodaj ofertę
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Osiągnięto limit ofert.</p>
                <Link href={`/${lang}/panel/plan-subskrypcji`} className="text-accent underline">
                  Zmień plan, aby dodać więcej
                </Link>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button asChild>
            <Link href={`/${lang}/panel/oferty/nowa`}>
              <PlusIcon data-icon="inline-start" />
              Dodaj ofertę
            </Link>
          </Button>
        )}

        <div className="flex items-center gap-3">
          {pagination && pagination.totalDocs > 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {pagination.totalDocs} {pagination.totalDocs === 1 ? 'oferta' : 'ofert'}
            </Badge>
          )}
          <OfferStatusFilter value={currentFilter || 'all'} onChange={handleFilterChange} />
        </div>
      </div>

      {offers.length === 0 ? (
        <p className="text-muted-foreground">Brak ofert o wybranym statusie.</p>
      ) : (
        <AnimatedCardGrid className="flex flex-col gap-4">
          {offers.map((offer, i) => (
            <AnimatedCard key={offer.id} delay={i * 0.08}>
              <OfferCard offer={offer} lang={lang} />
            </AnimatedCard>
          ))}
        </AnimatedCardGrid>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {pagination.hasPrevPage && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(pagination.currentPage - 1) }}
                  text="Poprzednia"
                />
              </PaginationItem>
            )}

            {getPageNumbers().map((page, i) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === pagination.currentPage}
                    onClick={(e) => { e.preventDefault(); handlePageChange(page) }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            {pagination.hasNextPage && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(pagination.currentPage + 1) }}
                  text="Następna"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
