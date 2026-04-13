'use client'

import Link from 'next/link'
import {
  AlertTriangleIcon,
  FileTextIcon,
  PlusIcon,
  PenLineIcon,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import type { User } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

interface ServiceProviderStats {
  role: 'service-provider'
  offers: {
    total: number
    published: number
    draft: number
  }
  newFormsCount: number
  subscription: CurrentSubscriptionDetails
  firstPublishedOfferLink?: string
}

interface ServiceProviderDashboardProps {
  stats: ServiceProviderStats
  user: User
  lang: string
}

export function ServiceProviderDashboard({ stats, user, lang }: ServiceProviderDashboardProps) {
  const maxOffers = user.maxOffers ?? 1
  const atLimit = stats.offers.total >= maxOffers
  const hasNoOffers = stats.offers.total === 0

  if (hasNoOffers) {
    return (
      <div className="flex flex-col gap-6">
        <Empty className="min-h-[50svh]">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileTextIcon /></EmptyMedia>
            <EmptyTitle>Nie masz jeszcze żadnych ofert</EmptyTitle>
            <EmptyDescription>Dodaj swoją pierwszą ofertę i dotrzyj do nowych klientów.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={`/${lang}/panel/oferty/nowa`}>
                <PlusIcon data-icon="inline-start" />
                Dodaj pierwszą ofertę
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Alerts section */}
      <div className="flex flex-col gap-3">
        {stats.subscription.cancelAtPeriodEnd && (
          <Alert>
            <AlertTriangleIcon />
            <AlertTitle>Subskrypcja wygasa</AlertTitle>
            <AlertDescription>
              Twoja subskrypcja nie zostanie odnowiona. Przejdź do planu subskrypcji, aby ją przedłużyć.
            </AlertDescription>
          </Alert>
        )}

        {atLimit && (
          <Alert>
            <AlertTriangleIcon />
            <AlertTitle>Osiągnięto limit ofert</AlertTitle>
            <AlertDescription>
              Wykorzystałeś wszystkie dostępne miejsca na oferty ({stats.offers.total} z {maxOffers}). Zmień plan, aby dodać więcej.
            </AlertDescription>
          </Alert>
        )}

        {stats.offers.draft > 0 && (
          <Alert>
            <AlertTriangleIcon />
            <AlertTitle>Oferty robocze</AlertTitle>
            <AlertDescription>
              Masz {stats.offers.draft} {stats.offers.draft === 1 ? 'ofertę w wersji roboczej' : 'ofert w wersji roboczej'}. Opublikuj je, aby były widoczne dla klientów.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active offers */}
        <Card>
          <CardHeader>
            <CardDescription>Aktywne oferty</CardDescription>
            <CardTitle className="font-bebas text-3xl tracking-wide">
              {stats.offers.published}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{stats.offers.published} z {maxOffers}</Badge>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/panel/oferty`}>Przejdź do ofert</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Draft offers */}
        <Card>
          <CardHeader>
            <CardDescription>Oferty robocze</CardDescription>
            <CardTitle className="font-bebas text-3xl tracking-wide">
              {stats.offers.draft}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{stats.offers.draft === 0 ? 'Brak' : 'Do opublikowania'}</Badge>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/panel/oferty`}>Przejdź do ofert</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* New forms */}
        <Card>
          <CardHeader>
            <CardDescription>Nowe formularze</CardDescription>
            <CardTitle className="font-bebas text-3xl tracking-wide">
              {stats.newFormsCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.newFormsCount > 0 ? (
              <Badge variant="default">Nowe</Badge>
            ) : (
              <Badge variant="secondary">Brak nowych</Badge>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/panel/formularze`}>Przejdź do formularzy</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardDescription>Subskrypcja</CardDescription>
            <CardTitle className="font-bebas text-3xl tracking-wide">
              {stats.subscription.currentPlan?.name ?? (stats.subscription.isBetaUser ? 'Beta' : 'Brak')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.subscription.hasSubscription ? (
              <Badge variant="secondary">
                {stats.subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            ) : (
              <Badge variant="destructive">Nieaktywna</Badge>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/panel/plan-subskrypcji`}>Zarządzaj planem</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {atLimit ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled>
                    <PlusIcon data-icon="inline-start" />
                    Dodaj nową ofertę
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Osiągnięto limit ofert ({maxOffers}). Zmień plan, aby dodać więcej.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button asChild>
            <Link href={`/${lang}/panel/oferty/nowa`}>
              <PlusIcon data-icon="inline-start" />
              Dodaj nową ofertę
            </Link>
          </Button>
        )}

        {stats.offers.published === 1 && stats.firstPublishedOfferLink && (
          <Button variant="outline" asChild>
            <Link href={`/${lang}/panel/oferty/${stats.firstPublishedOfferLink}`}>
              <PenLineIcon data-icon="inline-start" />
              Edytuj ofertę
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
