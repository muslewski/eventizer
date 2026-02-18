'use client'

import { PaginationInfo } from '@/app/(frontend)/[lang]/ogloszenia/ListView/index.client'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function PaginationControls({
  pagination,
  pathname,
  isPending,
  onNavigate,
}: {
  pagination: PaginationInfo
  pathname: string
  isPending?: boolean
  onNavigate?: (page: number) => void
}) {
  const searchParams = useSearchParams()
  const { currentPage, totalPages, hasPrevPage, hasNextPage, prevPage, nextPage } = pagination

  // Build URL preserving existing search params
  const buildPageUrl = (page: number | undefined) => {
    if (!page) return '#'

    const params = new URLSearchParams(searchParams.toString())
    params.set('strona', String(page))

    return `${pathname}?${params.toString()}`
  }

  // Navigate to page using parent's onNavigate callback
  const handlePageClick = useCallback(
    (page: number | undefined, e: React.MouseEvent) => {
      e.preventDefault()
      if (!page || !onNavigate) return
      onNavigate(page)
    },
    [onNavigate],
  )

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showPages = 5 // Max pages to show

    if (totalPages <= showPages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1)
    return (
      <div className="w-full flex justify-start gap-2">
        {/* Display just information stron 1 z 1 */}
        <Badge variant="secondary">{`Strona ${currentPage} z ${totalPages}`}</Badge>
        <Badge>{`Łącznie ${pagination.totalDocs} ofert`}</Badge>
      </div>
    )

  return (
    <Pagination className={cn('transition-opacity duration-200', isPending && 'opacity-50 pointer-events-none')}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={buildPageUrl(prevPage)}
            onClick={(e) => handlePageClick(prevPage, e)}
            aria-disabled={!hasPrevPage || isPending}
            className={!hasPrevPage ? 'pointer-events-none opacity-50' : ''}
            text="Poprzednia"
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis text="Więcej stron" />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href={buildPageUrl(page)}
                onClick={(e) => handlePageClick(page, e)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={buildPageUrl(nextPage)}
            onClick={(e) => handlePageClick(nextPage, e)}
            aria-disabled={!hasNextPage || isPending}
            className={!hasNextPage ? 'pointer-events-none opacity-50' : ''}
            text="Następna"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
