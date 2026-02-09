'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionExpiredBannerProps {
  serviceCategory?: string | null
}

export function SubscriptionExpiredBanner({
  serviceCategory,
}: SubscriptionExpiredBannerProps) {
  return (
    <Card className="max-w-3xl border-2 border-dashed border-accent/30 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-accent/20 border border-accent/30">
            <AlertTriangle className="w-5 h-5 text-accent-foreground dark:text-accent" />
          </div>
          Twoja subskrypcja wygasła
        </CardTitle>
        <CardDescription>
          Twoje oferty nie są obecnie widoczne publicznie, a dodawanie nowych ofert jest
          zablokowane.
          {serviceCategory && (
            <>
              {' '}
              Twoja ostatnia kategoria: <strong>{serviceCategory}</strong>.
            </>
          )}
        </CardDescription>
        <CardAction>
          <Button variant="accent" asChild>
            <Link href="/app/onboarding/service-provider?renew=true">
              Odnów subskrypcję
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
