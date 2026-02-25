'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  LayoutDashboard,
  Megaphone,
  Briefcase,
  RefreshCw,
  Settings,
  HelpCircle,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/access/hierarchy'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { getUserFirstOfferId } from '@/actions/getUserFirstOfferId'

type NavQuickLinksProps = {
  userRole: Role
  userId: number
}

type QuickLink = {
  href: string
  label: string
  icon: React.ElementType
  variant?: 'destructive'
}

export function NavQuickLinks({ userRole, userId }: NavQuickLinksProps) {
  const pathname = usePathname()
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null)
  const [firstOfferId, setFirstOfferId] = useState<number | null>(null)

  const isServiceProvider = userRole === 'service-provider'

  useEffect(() => {
    if (isServiceProvider) {
      getCurrentSubscriptionDetails(userId).then((details) => {
        setHasActiveSubscription(details.hasSubscription)
      })
      getUserFirstOfferId(userId).then((id) => {
        setFirstOfferId(id)
      })
    }
  }, [isServiceProvider, userId])

  const links: QuickLink[] = [
    {
      href: '/',
      label: 'Strona główna',
      icon: Home,
    },
    {
      href: '/app',
      label: 'Panel główny',
      icon: LayoutDashboard,
    },
    {
      href: '/ogloszenia#oferty',
      label: 'Lista ogłoszeń',
      icon: Megaphone,
    },
  ]

  // Subscription-related links for service providers
  if (isServiceProvider) {
    if (firstOfferId) {
      links.push({
        href: `/app/collections/offers/${firstOfferId}`,
        label: 'Zarządzaj ofertą',
        icon: FileText,
      })
    }

    if (hasActiveSubscription === true) {
      links.push({
        href: '/app/onboarding/service-provider?edit=true',
        label: 'Zmień plan',
        icon: Briefcase,
      })
    } else if (hasActiveSubscription === false) {
      links.push({
        href: '/app/onboarding/service-provider?renew=true',
        label: 'Wznów subskrypcję',
        icon: RefreshCw,
        variant: 'destructive',
      })
    }
  }

  links.push(
    {
      href: '/app/account',
      label: 'Zarządzaj kontem',
      icon: Settings,
    },
    {
      href: '/app/collections/help-tickets',
      label: 'Pomoc',
      icon: HelpCircle,
    },
  )

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {links.map((link) => {
        const isActive =
          link.href === '/'
            ? pathname === '/'
            : link.href === '/app'
              ? pathname === '/app'
              : pathname === link.href || pathname.startsWith(link.href + '/')
        const Icon = link.icon

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'group relative flex items-center gap-2 px-2 py-1.5 rounded-md',
              'no-underline transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 shadow-sm !text-accent'
                : link.variant === 'destructive'
                  ? '!text-destructive hover:!text-destructive hover:bg-destructive/10 hover:pl-2.5'
                  : '!text-muted-foreground hover:!text-foreground hover:bg-accent/10 hover:pl-2.5',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                className={cn(
                  'size-4 shrink-0 transition-colors duration-200',
                  isActive
                    ? 'text-accent'
                    : link.variant === 'destructive'
                      ? 'text-destructive'
                      : 'text-muted-foreground group-hover:text-accent/70',
                )}
              />
              <span
                className={cn(
                  'text-sm truncate transition-colors duration-200',
                  isActive ? 'font-medium' : '',
                )}
              >
                {link.label}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
