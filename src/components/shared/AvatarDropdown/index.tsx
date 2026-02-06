'use client'

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
} from 'lucide-react'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { getInitials, hasRole } from './utils'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

export interface AvatarDropdownProps {
  user: User
  /** Variant affects styling - 'admin' uses primary colors, 'frontend' uses white */
  variant?: 'admin' | 'frontend'
  /** Show home link (typically for admin panel) */
  showHomeLink?: boolean
  /** Custom logout handler - if not provided, renders a link to /app/sign-out */
  onLogout?: () => void
}

/**
 * A menu item that either uses Next.js Link (frontend) or
 * window.location.href (admin) to avoid Payload router conflicts.
 */
function MenuLink({
  href,
  hardNav,
  className,
  children,
}: {
  href: string
  hardNav: boolean
  className?: string
  children: ReactNode
}) {
  if (hardNav) {
    return (
      <DropdownMenuItem
        className={className}
        onSelect={() => {
          window.location.href = href
        }}
      >
        {children}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem asChild>
      <Link href={href} className={className}>
        {children}
      </Link>
    </DropdownMenuItem>
  )
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

  let imageUrl: string | null = null
  if (user?.profilePicture && isExpandedDoc<ProfilePicture>(user.profilePicture)) {
    imageUrl = user.profilePicture.url || null
  } else if (user?.image) {
    imageUrl = user.image
  }

  const isAdminVariant = variant === 'admin'
  // In admin panel, use hard navigation to avoid Payload router conflicts
  const hardNav = isAdminVariant

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full! overflow-hidden ${isAdminVariant ? 'focus:ring-primary/50' : 'focus:ring-white/50'}`}
        >
          <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarImage src={imageUrl ?? ''} />
            <AvatarFallback
              className={`text-sm ${
                isAdminVariant ? 'bg-primary/20 text-primary' : 'bg-white/20 text-white'
              }`}
            >
              {getInitials(user)}
            </AvatarFallback>
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
            <MenuLink href="/" hardNav={hardNav} className="cursor-pointer">
              <Home className="mr-2 h-4 w-4" />
              Strona główna
            </MenuLink>
          )}
          <MenuLink href="/app" hardNav={hardNav} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Panel główny
          </MenuLink>
          <MenuLink href="/ogloszenia#oferty" hardNav={hardNav} className="cursor-pointer">
            <Megaphone className="mr-2 h-4 w-4" />
            Lista ogłoszeń
          </MenuLink>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {!isServiceProvider && !isModerator && !isAdmin && (
            <MenuLink
              href="/app/onboarding/service-provider"
              hardNav={hardNav}
              className="cursor-pointer"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Zostań usługodawcą
            </MenuLink>
          )}

          {isServiceProvider && (
            <MenuLink href="/app/collections/offers" hardNav={hardNav} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              Zarządzaj ofertami
            </MenuLink>
          )}

          {(isModerator || isAdmin) && (
            <MenuLink href="/app/collections/users" hardNav={hardNav} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              Zarządzaj użytkownikami
            </MenuLink>
          )}

          {isAdmin && (
            <MenuLink href="/app/collections/pages" hardNav={hardNav} className="cursor-pointer">
              <FileEdit className="mr-2 h-4 w-4" />
              Zarządzaj stronami
            </MenuLink>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <MenuLink href="/app/account" hardNav={hardNav} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Zarządzaj kontem
          </MenuLink>
          <MenuLink
            href="/app/collections/help-tickets"
            hardNav={hardNav}
            className="cursor-pointer"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Pomoc
          </MenuLink>
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
          <MenuLink
            href="/app/sign-out"
            hardNav={hardNav}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Wyloguj się
          </MenuLink>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { getInitials, hasRole } from './utils'
