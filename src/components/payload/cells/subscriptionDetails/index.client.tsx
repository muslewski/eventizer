'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle, XCircle, AlertTriangle, Calendar, Crown } from 'lucide-react'
import type { SubscriptionStatus } from '@/actions/stripe/checkSubscription'
import { cn } from '@/lib/utils'

interface SubscriptionCellClientProps {
  subscriptionStatus: SubscriptionStatus
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function SubscriptionCellClient({ subscriptionStatus }: SubscriptionCellClientProps) {
  // No subscription
  if (!subscriptionStatus.hasActiveSubscription) {
    return (
      <div className="flex items-center gap-1.5">
        <XCircle className="w-3.5 h-3.5 text-[var(--theme-elevation-500)]" />
        <span className="text-sm text-[var(--theme-elevation-500)]">Brak</span>
      </div>
    )
  }

  const { status, plan, currentPeriodEnd, cancelAtPeriodEnd, cancelAt, isCancelling } =
    subscriptionStatus

  // Determine if subscription will end (not renew)
  const willEnd = isCancelling || cancelAtPeriodEnd

  // Use cancelAt if available, otherwise currentPeriodEnd
  const displayDate = willEnd && cancelAt ? cancelAt : currentPeriodEnd

  // Determine badge variant and styling
  const getBadgeContent = () => {
    if (willEnd) {
      return {
        icon: <AlertTriangle className="w-3 h-3" />,
        text: 'Anulowanie',
        className:
          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
      }
    }

    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: 'Aktywna',
          className:
            'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/20',
        }
      case 'trialing':
        return {
          icon: <Calendar className="w-3 h-3" />,
          text: 'Trial',
          className:
            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
        }
      case 'past_due':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          text: 'Zaległa',
          className:
            'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20',
        }
      case 'canceled':
        return {
          icon: <XCircle className="w-3 h-3" />,
          text: 'Anulowana',
          className:
            'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30 hover:bg-gray-500/20',
        }
      default:
        return {
          icon: null,
          text: status || 'Nieznany',
          className: '',
        }
    }
  }

  const badgeContent = getBadgeContent()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-default">
            {/* Plan badge with golden accent for premium feel */}
            {plan?.name && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30">
                <Crown className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {plan.name}
                </span>
              </div>
            )}

            {/* Status badge */}
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-1.5 py-0.5',
                badgeContent.className,
              )}
            >
              {badgeContent.icon}
              {badgeContent.text}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-[var(--theme-elevation-100)] border-[var(--theme-elevation-200)] text-[var(--theme-text)]"
        >
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--theme-elevation-600)]">
                {willEnd ? 'Wygaśnie:' : 'Odnowienie:'}
              </span>
              <span className="font-medium">{formatDate(displayDate)}</span>
            </div>
            {plan?.name && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--theme-elevation-600)]">Plan:</span>
                <span className="font-medium">{plan.name}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
