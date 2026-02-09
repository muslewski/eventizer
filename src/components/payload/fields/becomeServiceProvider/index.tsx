'use client'

import { Button } from '@/components/ui/button'
import { Briefcase, ArrowRight } from 'lucide-react'
import { useDocumentInfo, useAuth } from '@payloadcms/ui'
import Link from 'next/link'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function BecomeServiceProviderField() {
  const { id } = useDocumentInfo()
  const { user } = useAuth()

  // Only show the card if the user is a client and is viewing their own profile
  if (user?.id !== id || user?.role !== 'client') return null

  return (
    <Card className="max-w-3xl border-2 border-dashed border-accent/30 bg-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-accent/20 border border-accent/30">
            <Briefcase className="w-5 h-5 text-accent-foreground dark:text-accent" />
          </div>
          Zostań usługodawcą
        </CardTitle>
        <CardDescription>
          Chcesz oferować swoje usługi na naszej platformie? Przejdź proces onboardingu i wybierz
          kategorię usług, które chcesz świadczyć.
        </CardDescription>
        <CardAction>
          <Button variant="accent" asChild>
            <Link href="/app/onboarding/service-provider">
              Rozpocznij
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
