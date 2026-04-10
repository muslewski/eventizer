'use client'

import Link from 'next/link'
import { HeartIcon, HelpCircleIcon, StarIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { User } from '@/payload-types'

interface ClientStats {
  role: 'client'
  openTickets: number
  favoritesCount: number
}

interface ClientDashboardProps {
  stats: ClientStats
  user: User
  lang: string
}

export function ClientDashboard({ stats, lang }: ClientDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Favorites */}
        <Card>
          <CardHeader>
            <CardDescription>Ulubione oferty</CardDescription>
            <CardTitle className="font-bebas text-3xl tracking-wide">
              {stats.favoritesCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {stats.favoritesCount === 0 ? 'Brak ulubionych' : `${stats.favoritesCount} zapisanych`}
            </Badge>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/panel/ulubione`}>
                <HeartIcon data-icon="inline-start" />
                Przejdź do ulubionych
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Help tickets */}
        <Card>
          <CardHeader>
            <CardDescription>Zgłoszenia pomocy</CardDescription>
            <CardTitle className="font-bebas text-3xl tracking-wide">
              {stats.openTickets}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.openTickets > 0 ? (
              <Badge variant="default">Otwarte</Badge>
            ) : (
              <Badge variant="secondary">Brak otwartych</Badge>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${lang}/panel/pomoc`}>
                <HelpCircleIcon data-icon="inline-start" />
                Przejdź do pomocy
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* CTA Card */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="font-bebas text-2xl tracking-wide">Zostań usługodawcą</CardTitle>
          <CardDescription>Dodaj swoją ofertę i dotrzyj do tysięcy klientów szukających usług eventowych.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/${lang}/panel/plan-subskrypcji`}>
              <StarIcon data-icon="inline-start" />
              Rozpocznij
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
