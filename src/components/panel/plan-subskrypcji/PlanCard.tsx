'use client'

import { CheckIcon, XIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SubscriptionPlan } from '@/payload-types'

interface PlanCardProps {
  plan: SubscriptionPlan
  isSelected: boolean
  onSelect: (plan: SubscriptionPlan) => void
  isCurrentPlan?: boolean
}

export function PlanCard({ plan, isSelected, onSelect, isCurrentPlan }: PlanCardProps) {
  const monthlyPrice = (plan as any).monthlyPrice
  const yearlyPrice = (plan as any).yearlyPrice

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:border-accent/60',
        isSelected && 'border-accent',
        isCurrentPlan && 'border-primary/40',
      )}
      onClick={() => onSelect(plan)}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-bebas text-xl tracking-wide">{plan.name}</CardTitle>
          {plan.highlighted && <Badge>Najpopularniejszy</Badge>}
        </div>
        <CardDescription>
          {plan.description ?? (monthlyPrice ? `od ${monthlyPrice} zł/mies.` : 'Skontaktuj się w sprawie ceny')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {plan.features && plan.features.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {plan.features.map((feature) => (
              <li key={feature.id ?? feature.feature} className="flex items-center gap-2 text-sm">
                {feature.included ? (
                  <CheckIcon className="size-4 shrink-0 text-green-500" />
                ) : (
                  <XIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn(!feature.included && 'text-muted-foreground')}>
                  {feature.feature}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Brak informacji o funkcjach.</p>
        )}
      </CardContent>

      {isCurrentPlan && (
        <CardFooter>
          <Badge variant="secondary">Aktualny plan</Badge>
        </CardFooter>
      )}
    </Card>
  )
}
