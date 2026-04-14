'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusIcon, FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

interface OffersListViewProps {
  offers: Offer[]
  maxOffers: number
  lang: string
}

export function OffersListView({ offers, maxOffers, lang }: OffersListViewProps) {
  const [filter, setFilter] = useState<string>('all')

  const filteredOffers =
    filter === 'all'
      ? offers
      : offers.filter((offer) => offer._status === filter)

  const atLimit = offers.length >= maxOffers

  if (offers.length === 0) {
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

  return (
    <div className="flex flex-col gap-6">
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
              <TooltipContent>Osiągnięto limit ofert</TooltipContent>
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

        <OfferStatusFilter value={filter} onChange={setFilter} />
      </div>

      {filteredOffers.length === 0 ? (
        <p className="text-muted-foreground">Brak ofert o wybranym statusie.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} lang={lang} />
          ))}
        </div>
      )}
    </div>
  )
}
