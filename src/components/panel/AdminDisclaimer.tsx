import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ShieldAlertIcon } from 'lucide-react'

interface AdminDisclaimerProps {
  role: string
  variant?: 'dashboard' | 'subscription' | 'offers'
}

export function AdminDisclaimer({ role, variant = 'dashboard' }: AdminDisclaimerProps) {
  if (role !== 'admin' && role !== 'moderator') return null

  const roleLabel = role === 'admin' ? 'administratora' : 'moderatora'

  return (
    <Alert className="border-accent/20 bg-accent/5">
      <ShieldAlertIcon className="size-4 text-accent" />
      <AlertTitle className="text-sm">Konto {roleLabel}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        {variant === 'dashboard' && (
          <>
            <p className="text-sm text-muted-foreground">
              Przeglądasz panel usługodawcy z uprawnieniami {roleLabel}. Aby zarządzać
              użytkownikami, stronami i moderować treści, przejdź do panelu administracyjnego.
            </p>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href="/app">
                Panel administracyjny
              </Link>
            </Button>
          </>
        )}
        {variant === 'subscription' && (
          <p className="text-sm text-muted-foreground">
            Jako {role === 'admin' ? 'administrator' : 'moderator'} nie musisz posiadać płatnego planu
            subskrypcji. Masz pełny dostęp do wszystkich funkcji platformy.
          </p>
        )}
        {variant === 'offers' && (
          <>
            <p className="text-sm text-muted-foreground">
              Tutaj widzisz oferty przypisane do Twojego konta. Aby zarządzać wszystkimi
              ofertami na platformie, przejdź do panelu administracyjnego.
            </p>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href="/app/collections/offers">
                Zarządzaj wszystkimi ofertami
              </Link>
            </Button>
          </>
        )}
      </AlertDescription>
    </Alert>
  )
}
