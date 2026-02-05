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
} from 'lucide-react'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { getInitials, hasRole } from './utils'

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

  let imageUrl: string | null = null
  if (user?.profilePicture && isExpandedDoc<ProfilePicture>(user.profilePicture)) {
    imageUrl = user.profilePicture.url || null
  } else if (user?.image) {
    imageUrl = user.image
  }

  const isAdminVariant = variant === 'admin'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={isAdminVariant ? 'rounded-full! overflow-hidden' : undefined}
        asChild
      >
        <button
          className={`focus:outline-none focus:ring-2 rounded-full ${
            isAdminVariant ? 'focus:ring-primary/50' : 'focus:ring-white/50'
          }`}
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
        </button>
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
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {/* Tylko klient: Zostań usługodawcą */}
          {!isServiceProvider && !isModerator && !isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/app/onboarding/service-provider" className="cursor-pointer">
                <Briefcase className="mr-2 h-4 w-4" />
                Zostań usługodawcą
              </Link>
            </DropdownMenuItem>
          )}

          {/* Opcje usługodawcy */}
          {isServiceProvider && (
            <DropdownMenuItem asChild>
              <Link href="/app/collections/offers" className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Zarządzaj ofertami
              </Link>
            </DropdownMenuItem>
          )}

          {/* Moderator i Admin: Zarządzaj użytkownikami */}
          {(isModerator || isAdmin) && (
            <DropdownMenuItem asChild>
              <Link href="/app/collections/users" className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                Zarządzaj użytkownikami
              </Link>
            </DropdownMenuItem>
          )}

          {/* Tylko Admin: Zarządzaj stronami */}
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
              href="/app/sign-out"
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
