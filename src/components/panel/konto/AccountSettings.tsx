'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOutIcon, CreditCardIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AnimatedCardGrid, AnimatedCard } from '@/components/panel/AnimatedCards'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { useRootAuth } from '@/providers/RootAuthProvider'
import type { User } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

interface AccountSettingsProps {
  user: User
  subscription?: CurrentSubscriptionDetails
  lang: string
}

function roleLabel(role: User['role']): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'moderator':
      return 'Moderator'
    case 'service-provider':
      return 'Usługodawca'
    default:
      return 'Klient'
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AccountSettings({ user, subscription, lang }: AccountSettingsProps) {
  const router = useRouter()
  const { logout } = useRootAuth()
  const [isPendingPassword, startPasswordTransition] = useTransition()

  const isProvider =
    user.role === 'service-provider' ||
    user.role === 'admin' ||
    user.role === 'moderator'

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    startPasswordTransition(async () => {
      toast.info('Zmiana hasła zostanie wkrótce dostępna')
    })
  }

  async function handleLogout() {
    await logout()
    router.push(`/${lang}/auth/sign-in`)
  }

  return (
    <AnimatedCardGrid className="flex flex-col gap-8">
      {/* Profile */}
      <AnimatedCard delay={0}><Card className="bg-background border-border/20">
        <CardHeader>
          <CardTitle className="font-bebas text-2xl tracking-wide">Profil</CardTitle>
          <CardDescription>Informacje o Twoim koncie</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="font-medium">{user.name}</p>
              <Badge variant="secondary">{roleLabel(user.role)}</Badge>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-email">Email</FieldLabel>
              <Input
                id="account-email"
                type="email"
                value={user.email}
                disabled
                readOnly
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card></AnimatedCard>

      <Separator />

      {/* Password */}
      <AnimatedCard delay={0.1}><Card className="bg-background border-border/20">
        <CardHeader>
          <CardTitle className="font-bebas text-2xl tracking-wide">Zmiana hasła</CardTitle>
          <CardDescription>Zaktualizuj swoje hasło logowania</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="current-password">Aktualne hasło</FieldLabel>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-password">Nowe hasło</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Potwierdź nowe hasło</FieldLabel>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>
            </FieldGroup>
            <div className="mt-6">
              <Button type="submit" disabled={isPendingPassword}>
                {isPendingPassword && <Spinner data-icon="inline-start" />}
                Zmień hasło
              </Button>
            </div>
          </form>
        </CardContent>
      </Card></AnimatedCard>

      {/* Subscription (provider only) */}
      {isProvider && subscription && (
        <>
          <Separator />
          <AnimatedCard delay={0.2}><Card className="bg-background border-border/20">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="font-bebas text-2xl tracking-wide">Subskrypcja</CardTitle>
                <Badge variant={subscription.hasSubscription ? 'secondary' : 'destructive'}>
                  {subscription.hasSubscription ? 'Aktywna' : 'Nieaktywna'}
                </Badge>
              </div>
              <CardDescription>
                {subscription.hasSubscription
                  ? (subscription.isBetaUser
                      ? 'Plan Beta'
                      : (subscription.currentPlan?.name ?? 'Aktywna subskrypcja'))
                  : 'Brak aktywnej subskrypcji'}
              </CardDescription>
            </CardHeader>
            {user.serviceCategory && (
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Kategoria: <span className="text-foreground">{user.serviceCategory}</span>
                </p>
              </CardContent>
            )}
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href={`/${lang}/panel/plan-subskrypcji`}>
                  <CreditCardIcon data-icon="inline-start" />
                  Zarządzaj subskrypcją
                </Link>
              </Button>
            </CardFooter>
          </Card></AnimatedCard>
        </>
      )}

      <Separator />

      {/* Logout */}
      <div className="flex flex-col gap-3">
        <h2 className="font-bebas text-2xl tracking-wide">Wyloguj się</h2>
        <p className="text-sm text-muted-foreground">
          Zakończ bieżącą sesję i wróć do strony logowania.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-fit">
              <LogOutIcon data-icon="inline-start" />
              Wyloguj się
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz się wylogować?</AlertDialogTitle>
              <AlertDialogDescription>
                Zostaniesz przekierowany do strony logowania.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Wyloguj się
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AnimatedCardGrid>
  )
}
