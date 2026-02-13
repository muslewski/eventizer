'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { checkSubscription, SubscriptionStatus } from '@/actions/stripe/checkSubscription'
import {
  cancelSubscription,
  reactivateSubscription,
  createBillingPortalSession,
} from '@/actions/stripe/manageSubscription'
import { cn } from '@/lib/utils'

interface SubscriptionDetailsClientProps {
  userId: number
  subscriptionStatus: SubscriptionStatus
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Brak daty'
  return new Date(dateString).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getStatusBadge(status: SubscriptionStatus['status'], isCancelling: boolean) {
  // Use isCancelling instead of just cancelAtPeriodEnd
  if (isCancelling) {
    return (
      <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/30">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Anulowanie zaplanowane
      </Badge>
    )
  }

  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aktywna
        </Badge>
      )
    case 'trialing':
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
          <Calendar className="w-3 h-3 mr-1" />
          Okres próbny
        </Badge>
      )
    case 'past_due':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Zaległa płatność
        </Badge>
      )
    case 'canceled':
      return (
        <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Anulowana
        </Badge>
      )
    default:
      return <Badge variant="outline">{status || 'Nieznany'}</Badge>
  }
}

export function SubscriptionDetailsClient({
  userId,
  subscriptionStatus,
}: SubscriptionDetailsClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [localStatus, setLocalStatus] = useState(subscriptionStatus)

  // Auto-refresh on mount to get latest data
  useEffect(() => {
    const refreshStatus = async () => {
      setIsLoading(true)
      try {
        const newStatus = await checkSubscription(userId)
        setLocalStatus(newStatus)
      } catch (error) {
        console.error('Failed to refresh subscription status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    refreshStatus()
  }, [userId])

  const handleRefresh = async () => {
    setIsLoading(true)
    setActionMessage(null)

    try {
      const newStatus = await checkSubscription(userId)
      setLocalStatus(newStatus)
      setActionMessage({
        type: 'success',
        text: 'Dane subskrypcji zostały odświeżone.',
      })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: 'Nie udało się odświeżyć danych subskrypcji.',
      })
    }

    setIsLoading(false)
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    setActionMessage(null)

    const result = await cancelSubscription(userId)

    if (result.success) {
      setActionMessage({
        type: 'success',
        text: result.message,
      })
      setLocalStatus((prev) => ({
        ...prev,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd ?? false,
        isCancelling: result.cancelAtPeriodEnd ?? false,
      }))
    } else {
      setActionMessage({ type: 'error', text: result.message })
    }
    setIsLoading(false)
  }

  const handleReactivateSubscription = async () => {
    setIsLoading(true)
    setActionMessage(null)

    const result = await reactivateSubscription(userId)

    if (result.success) {
      setActionMessage({
        type: 'success',
        text: result.message,
      })
      setLocalStatus((prev) => ({
        ...prev,
        cancelAtPeriodEnd: false,
        cancelAt: null,
        isCancelling: false,
      }))
    } else {
      setActionMessage({ type: 'error', text: result.message })
    }
    setIsLoading(false)
  }

  const handleOpenBillingPortal = async () => {
    setIsLoading(true)
    setActionMessage(null)

    const result = await createBillingPortalSession(userId, window.location.href)

    if (result.success && result.url) {
      window.open(result.url, '_blank')
    } else {
      setActionMessage({
        type: 'error',
        text: result.message || 'Nie można otworzyć portalu rozliczeniowego.',
      })
    }

    setIsLoading(false)
  }

  // No subscription state
  if (!localStatus.hasActiveSubscription) {
    return (
      <Card className="border-[var(--theme-elevation-150)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5" />
            Subskrypcja
          </CardTitle>
          <CardDescription>Użytkownik nie posiada aktywnej subskrypcji</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 rounded-lg bg-[var(--theme-elevation-50)] border border-[var(--theme-elevation-150)]">
            <XCircle className="w-5 h-5 text-[var(--theme-elevation-500)]" />
            <span className="text-[var(--theme-elevation-700)]">Brak aktywnej subskrypcji</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use isCancelling for badge and button logic
  const isCancelling = localStatus.isCancelling

  // Determine if subscription will end (not renew)
  const willEnd = isCancelling || localStatus.cancelAtPeriodEnd

  // For displaying the date, prefer cancelAt over currentPeriodEnd when cancelling
  const displayDate =
    willEnd && localStatus.cancelAt ? localStatus.cancelAt : localStatus.currentPeriodEnd

  return (
    <Card className="border-[var(--theme-elevation-150)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5" />
            Subskrypcja
          </CardTitle>
          {getStatusBadge(localStatus.status, isCancelling)}
        </div>
        {/* {localStatus.plan && (
          <CardDescription className="mt-1">
            Plan: <span className="font-medium">{localStatus.plan.name}</span>
          </CardDescription>
        )} */}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Subscription Info */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Period */}
          <div className="p-4 rounded-lg bg-[var(--theme-elevation-50)] border border-[var(--theme-elevation-150)]">
            <div className="flex items-center gap-2 mb-2 text-sm text-[var(--theme-elevation-600)]">
              <Calendar className="w-4 h-4" />
              {willEnd ? 'Data wygaśnięcia' : 'Data odnowienia'}
            </div>
            <div className="text-lg font-semibold text-[var(--theme-text)]">
              {formatDate(displayDate)}
            </div>
            {willEnd && (
              <p className="mt-1 text-sm text-accent-foreground">
                Subskrypcja wygaśnie po tej dacie
              </p>
            )}
          </div>

          {/* Subscription ID */}
          {localStatus.subscription && (
            <div className="p-4 rounded-lg bg-[var(--theme-elevation-50)] border border-[var(--theme-elevation-150)]">
              <div className="flex items-center gap-2 mb-2 text-sm text-[var(--theme-elevation-600)]">
                <CreditCard className="w-4 h-4" />
                ID Subskrypcji
              </div>
              <div className="text-sm font-mono text-[var(--theme-text)] truncate">
                {localStatus.subscription.id}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Action Message */}
        {actionMessage && (
          <div
            className={cn(
              'p-3 rounded-lg flex items-center gap-2',
              actionMessage.type === 'success'
                ? 'bg-green-500/10 text-green-700 border border-green-500/30'
                : 'bg-red-500/10 text-red-700 border border-red-500/30',
            )}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {actionMessage.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {/* Refresh Button */}
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Odśwież
          </Button>

          {/* Billing Portal */}
          <Button variant="outline" onClick={handleOpenBillingPortal} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4 mr-2" />
            )}
            Portal rozliczeniowy
          </Button>

          {/* Cancel or Reactivate */}
          {isCancelling ? (
            <Button
              variant="outline"
              onClick={handleReactivateSubscription}
              disabled={isLoading}
              className="border-green-500/30 text-green-700 hover:bg-green-500/10"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Reaktywuj subskrypcję
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="border-red-500/30 text-red-700 dark:text-red-500 hover:bg-red-500/10 hover:dark:bg-red-500/20"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Anuluj subskrypcję
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy na pewno chcesz anulować subskrypcję?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Subskrypcja zostanie anulowana na koniec bieżącego okresu rozliczeniowego (
                    {formatDate(localStatus.currentPeriodEnd)}). Do tego czasu użytkownik zachowa
                    pełny dostęp do funkcji.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Tak, anuluj subskrypcję
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
