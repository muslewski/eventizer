'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubscriptionPlan } from '@/payload-types'
import type { PlanPriceSummary } from '@/actions/stripe/products/getPlanPriceSummary'

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

interface PlanPickerCardProps {
  plan: SubscriptionPlan
  priceSummary: PlanPriceSummary
  selected: boolean
  onSelect: () => void
}

export function PlanPickerCard({ plan, priceSummary, selected, onSelect }: PlanPickerCardProps) {
  const limit = plan.maxOffers ?? 1
  const limitLabel = `Do ${limit} ${limit === 1 ? 'oferty' : limit < 5 ? 'ofert' : 'ofert'}`

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:border-accent/60 flex flex-col',
        selected && 'border-accent',
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="font-bebas font-normal text-2xl tracking-wide">{plan.name}</CardTitle>
          <Badge variant="secondary">{limitLabel}</Badge>
        </div>
        {plan.description && <CardDescription>{plan.description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {priceSummary.monthly ? (
            <span>{formatPrice(priceSummary.monthly.amount, priceSummary.monthly.currency)} / miesiąc</span>
          ) : (
            <span>Cena niedostępna</span>
          )}
          {priceSummary.yearly && (
            <span>{formatPrice(priceSummary.yearly.amount, priceSummary.yearly.currency)} / rok</span>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button variant={selected ? 'default' : 'outline'} className="w-full" onClick={onSelect}>
          Wybierz
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
