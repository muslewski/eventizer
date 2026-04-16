'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
import type { ReactNode } from 'react'
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
  ShieldIcon,
  PanelLeftIcon,
} from 'lucide-react'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { getInitials, hasRole } from './utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { isReturningCustomer } from '@/actions/stripe/isReturningCustomer'
import { getUserOffersInfo } from '@/actions/getUserOffersInfo'

export interface AvatarDropdownProps {
  user: User
  /** Variant affects styling - 'admin' uses primary colors, 'frontend' uses white */
  variant?: 'admin' | 'frontend'
  /** Show home link (typically for admin panel) */
  showHomeLink?: boolean
  /** Custom logout handler - if not provided, renders a link to /app/sign-out */
  onLogout?: () => void
  /** Optional label displayed next to the avatar (e.g. role name on mobile) */
  label?: ReactNode
  /** Hide the outline border around the avatar button */
  noBorder?: boolean
}

export function AvatarDropdown({
  user,
  variant = 'frontend',
  showHomeLink = false,
  onLogout,
  label,
  noBorder = false,
}: AvatarDropdownProps) {
  const isServiceProvider = hasRole(user, 'service-provider')
  const isModerator = hasRole(user, 'moderator')
  const isAdmin = hasRole(user, 'admin')

  // Check subscription status for service-providers, and returning customer status for clients
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null)
  const [isReturning, setIsReturning] = useState<boolean>(false)
  // Tracks actual offer count and first offer id for service providers
  const [firstOfferId, setFirstOfferId] = useState<number | null>(null)
  const [firstOfferSlug, setFirstOfferSlug] = useState<string | null>(null)
  const [offerCount, setOfferCount] = useState<number>(0)
  const [adminView, setAdminView] = useState<'admin' | 'provider'>('admin')

  const isClient = !isServiceProvider && !isModerator && !isAdmin
  // Base plural label on how many offers the user actually has
  const hasMultipleOffers = offerCount > 1

  useEffect(() => {
    // Always check actual subscription status regardless of role
    // This handles the case where a user is a client but has an active subscription
    // (role mismatch that gets self-healed on next dashboard visit)
    getCurrentSubscriptionDetails(user.id).then((details) => {
      setHasActiveSubscription(details.hasSubscription)

      // For clients: also check returning customer status if no active subscription
      if (isClient && !details.hasSubscription) {
        isReturningCustomer(user.id).then((returning) => {
          setIsReturning(returning)
        })
      }
    })

    if (isServiceProvider) {
      getUserOffersInfo(user.id).then(({ firstId, firstSlug, count }) => {
        setFirstOfferId(firstId)
        setFirstOfferSlug(firstSlug)
        setOfferCount(count)
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
        <Button
          variant={noBorder ? 'ghost' : 'outline'}
          size={label ? 'default' : 'icon'}
          className={cn(
            'rounded-full! overflow-hidden',
            noBorder && 'border-none shadow-none',
            label && 'gap-2 pl-0.5 pr-3',
          )}
        >
          <Avatar className="h-9 w-9 cursor-pointer bg-white dark:bg-background/10">
            <AvatarImage src={imageUrl ?? ''} />
            <AvatarFallback className="bg-base-900/40">{getInitials(user)}</AvatarFallback>
          </Avatar>
          {label && (
            <span className="leading-none">{label}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name ?? 'Użytkownik'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* ── Admin/Moderator: Toggle between panels ── */}
        {(isAdmin || isModerator) && (
          <>
            {/* Toggle with sliding indicator */}
            <div className="relative flex items-center gap-1 rounded-lg bg-muted/50 p-1 mx-2 my-1.5">
              <motion.div
                className="absolute inset-y-1 rounded-md bg-accent/15"
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  left: adminView === 'admin' ? '4px' : '50%',
                  right: adminView === 'admin' ? '50%' : '4px',
                }}
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setAdminView('admin') }}
                className={cn(
                  'relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  adminView === 'admin' ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <ShieldIcon className="h-3 w-3" />
                Admin
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setAdminView('provider') }}
                className={cn(
                  'relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  adminView === 'provider' ? 'text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <PanelLeftIcon className="h-3 w-3" />
                Usługodawca
              </button>
            </div>

            <DropdownMenuSeparator />

            {/* Animated content switch */}
            <AnimatePresence mode="wait">
              {adminView === 'admin' ? (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/app" prefetch className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/collections/offers" prefetch className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        Oferty
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/app/collections/users" prefetch className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        Użytkownicy
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/app/collections/pages" prefetch className="cursor-pointer">
                          <FileEdit className="mr-2 h-4 w-4" />
                          Strony
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </motion.div>
              ) : (
                <motion.div
                  key="provider"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/panel/dashboard" prefetch className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/panel/oferty" prefetch className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        Oferty
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/panel/plan-subskrypcji" prefetch className="cursor-pointer">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Plan subskrypcji
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── Service Provider ── */}
        {isServiceProvider && !isAdmin && !isModerator && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/panel/dashboard" prefetch className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Panel główny
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={
                  !hasMultipleOffers && firstOfferSlug
                    ? `/panel/oferty/${firstOfferSlug}`
                    : '/panel/oferty'
                }
                prefetch
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                {!hasMultipleOffers ? 'Zarządzaj ofertą' : 'Zarządzaj ofertami'}
              </Link>
            </DropdownMenuItem>
            {hasActiveSubscription === true && (
              <DropdownMenuItem asChild>
                <Link href="/panel/plan-subskrypcji" prefetch className="cursor-pointer">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Zmień plan
                </Link>
              </DropdownMenuItem>
            )}
            {hasActiveSubscription === false && (
              <DropdownMenuItem asChild>
                <Link href="/panel/plan-subskrypcji" prefetch className="cursor-pointer text-destructive focus:text-destructive">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Wznów subskrypcję
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        )}

        {/* ── Client ── */}
        {isClient && (
          <DropdownMenuGroup>
            {hasActiveSubscription === true && (
              <DropdownMenuItem asChild>
                <Link href="/panel/dashboard" prefetch className="cursor-pointer">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Zarządzaj ofertami
                </Link>
              </DropdownMenuItem>
            )}
            {hasActiveSubscription !== true && !isReturning && (
              <DropdownMenuItem asChild>
                <Link href="/panel/plan-subskrypcji" prefetch className="cursor-pointer">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Zostań usługodawcą
                </Link>
              </DropdownMenuItem>
            )}
            {hasActiveSubscription === false && isReturning && (
              <DropdownMenuItem asChild>
                <Link href="/panel/plan-subskrypcji" prefetch className="cursor-pointer text-destructive focus:text-destructive">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Wznów subskrypcję
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        {/* ── Common links ── */}
        <DropdownMenuGroup>
          {showHomeLink && (
            <DropdownMenuItem asChild>
              <Link href="/" prefetch className="cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                Strona główna
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/ogloszenia#oferty" prefetch className="cursor-pointer">
              <Megaphone className="mr-2 h-4 w-4" />
              Lista ogłoszeń
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/panel/konto" prefetch className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Konto
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/panel/pomoc" prefetch className="cursor-pointer">
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
