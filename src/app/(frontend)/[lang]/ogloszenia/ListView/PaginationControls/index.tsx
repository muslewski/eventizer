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
import { useSearchParams } from 'next/navigation'

export default function PaginationControls({
  pagination,
  pathname,
}: {
  pagination: PaginationInfo
  pathname: string
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
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={buildPageUrl(prevPage)}
            aria-disabled={!hasPrevPage}
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
              <PaginationLink href={buildPageUrl(page)} isActive={page === currentPage}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={buildPageUrl(nextPage)}
            aria-disabled={!hasNextPage}
            className={!hasNextPage ? 'pointer-events-none opacity-50' : ''}
            text="Następna"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
