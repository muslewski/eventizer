'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProfilePicture, User } from '@/payload-types'
import Link from 'next/link'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  FileEdit,
  Settings,
  HelpCircle,
  LogOut,
  Home,
  Megaphone,
  RefreshCw,
} from 'lucide-react'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { getInitials, hasRole } from './utils'
import { Button } from '@/components/ui/button'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { isReturningCustomer } from '@/actions/stripe/isReturningCustomer'

export interface AvatarDropdownProps {
  user: User
  /** Variant affects styling - 'admin' uses primary colors, 'frontend' uses white */
  variant?: 'admin' | 'frontend'
  /** Show home link (typically for admin panel) */
  showHomeLink?: boolean
  /** Custom logout handler - if not provided, renders a link to /app/sign-out */
  onLogout?: () => void
}

export function AvatarDropdown({
  user,
  variant = 'frontend',
  showHomeLink = false,
  onLogout,
}: AvatarDropdownProps) {
  const isServiceProvider = hasRole(user, 'service-provider')
  const isModerator = hasRole(user, 'moderator')
  const isAdmin = hasRole(user, 'admin')

  // Check subscription status for service-providers, and returning customer status for clients
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null)
  const [isReturning, setIsReturning] = useState<boolean>(false)

  const isClient = !isServiceProvider && !isModerator && !isAdmin

  useEffect(() => {
    if (isServiceProvider) {
      getCurrentSubscriptionDetails(user.id).then((details) => {
        setHasActiveSubscription(details.hasSubscription)
      })
    } else if (isClient) {
      // Check if this client was previously a paying customer
      isReturningCustomer(user.id).then((returning) => {
        setIsReturning(returning)
      })
    }
  }, [isServiceProvider, isClient, user.id])

  let imageUrl: string | null = null
  if (user?.profilePicture && isExpandedDoc<ProfilePicture>(user.profilePicture)) {
    imageUrl = user.profilePicture.url || null
  } else if (user?.image) {
    imageUrl = user.image
  }

  const isAdminVariant = variant === 'admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full! overflow-hidden">
          <Avatar className="h-9 w-9 cursor-pointer bg-white dark:bg-background/10">
            <AvatarImage src={imageUrl ?? ''} />
            <AvatarFallback className="bg-base-900/40">{getInitials(user)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name ?? 'Użytkownik'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {showHomeLink && (
            <DropdownMenuItem asChild>
              <Link href="/" className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                Strona główna
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/app" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Panel główny
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/ogloszenia#oferty" className="cursor-pointer">
              <Megaphone className="mr-2 h-4 w-4" />
              Lista ogłoszeń
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* Client who was never a customer */}
          {isClient && !isReturning && (
            <DropdownMenuItem asChild>
              <Link href="/app/onboarding/service-provider" className="cursor-pointer">
                <Briefcase className="mr-2 h-4 w-4" />
                Zostań usługodawcą
              </Link>
            </DropdownMenuItem>
          )}

          {/* Client who previously had a subscription (returning customer) */}
          {isClient && isReturning && (
            <DropdownMenuItem asChild>
              <Link
                href="/app/onboarding/service-provider?renew=true"
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Wznów subskrypcję
              </Link>
            </DropdownMenuItem>
          )}

          {(isServiceProvider || isModerator || isAdmin) && (
            <DropdownMenuItem asChild>
              <Link href="/app/collections/offers" className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Zarządzaj ofertami
              </Link>
            </DropdownMenuItem>
          )}

          {(isModerator || isAdmin) && (
            <DropdownMenuItem asChild>
              <Link href="/app/collections/users" className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Zarządzaj użytkownikami
              </Link>
            </DropdownMenuItem>
          )}

          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/app/collections/pages" className="cursor-pointer">
                <FileEdit className="mr-2 h-4 w-4" />
                Zarządzaj stronami
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* Service provider with active subscription - can change plan */}
          {isServiceProvider && hasActiveSubscription === true && (
            <DropdownMenuItem asChild>
              <Link href="/app/onboarding/service-provider?edit=true" className="cursor-pointer">
                <Briefcase className="mr-2 h-4 w-4" />
                Zmień plan
              </Link>
            </DropdownMenuItem>
          )}

          {/* Service provider whose subscription expired */}
          {isServiceProvider && hasActiveSubscription === false && (
            <DropdownMenuItem asChild>
              <Link
                href="/app/onboarding/service-provider?renew=true"
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Wznów subskrypcję
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link href="/app/account" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Zarządzaj kontem
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/collections/help-tickets" className="cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              Pomoc
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {onLogout ? (
          <DropdownMenuItem
            onClick={onLogout}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Wyloguj się
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              href="/app/sign-out-redirect"
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Wyloguj się
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { getInitials, hasRole } from './utils'
