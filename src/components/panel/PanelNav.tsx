'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useScroll, useTransform } from 'motion/react'
import {
  LayoutDashboardIcon,
  FileTextIcon,
  CreditCardIcon,
  InboxIcon,
  HelpCircleIcon,
  HeartIcon,
  StarIcon,
  SettingsIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/payload-types'

interface PanelNavProps {
  user: User
  lang: string
}

const serviceProviderNav = [
  { label: 'Dashboard', icon: LayoutDashboardIcon, route: '/panel/dashboard' },
  { label: 'Oferty', icon: FileTextIcon, route: '/panel/oferty' },
  { label: 'Plan subskrypcji', icon: CreditCardIcon, route: '/panel/plan-subskrypcji' },
  { label: 'Formularze', icon: InboxIcon, route: '/panel/formularze' },
  { label: 'Pomoc', icon: HelpCircleIcon, route: '/panel/pomoc' },
]

const clientNav = [
  { label: 'Dashboard', icon: LayoutDashboardIcon, route: '/panel/dashboard' },
  { label: 'Ulubione', icon: HeartIcon, route: '/panel/ulubione' },
  { label: 'Pomoc', icon: HelpCircleIcon, route: '/panel/pomoc' },
  { label: 'Zostań usługodawcą', icon: StarIcon, route: '/panel/plan-subskrypcji' },
]

// Header clearance: top-4 (16px) + h-16 (64px) = 80px on mobile
// Sticky offset when scrolled: top-2 (8px)
// The scroll distance to transition between them: 80 - 8 = 72px
const HEADER_CLEARANCE = 80
const STICKY_OFFSET = 8
const SCROLL_DISTANCE = HEADER_CLEARANCE - STICKY_OFFSET

export function PanelNav({ user, lang }: PanelNavProps) {
  const pathname = usePathname()
  const { scrollY } = useScroll()

  // Dynamic height: shrinks at page top (header visible), grows as you scroll (header gone)
  // At scroll 0: height = 100svh - 80px (viewport minus header clearance)
  // At scroll 72px+: height = 100svh - 8px (viewport minus small sticky offset)
  const sidebarHeight = useTransform(
    scrollY,
    [0, SCROLL_DISTANCE],
    [`calc(100svh - ${HEADER_CLEARANCE}px)`, `calc(100svh - ${STICKY_OFFSET}px)`],
  )

  const isServiceProvider =
    user.role === 'service-provider' || user.role === 'admin' || user.role === 'moderator'
  const navItems = isServiceProvider ? serviceProviderNav : clientNav
  const roleLabel = isServiceProvider ? 'Usługodawca' : 'Klient'

  return (
    <Sidebar
      side="left"
      variant="floating"
      collapsible="icon"
      style={{ height: sidebarHeight as unknown as string }}
    >
      <SidebarHeader>
        <Badge variant="outline" className="text-accent border-accent/30">
          {roleLabel}
        </Badge>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Nawigacja</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const fullHref = `/${lang}${item.route}`
                return (
                  <SidebarMenuItem key={item.route}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(fullHref)}>
                      <Link href={fullHref}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith(`/${lang}/panel/konto`)}>
              <Link href={`/${lang}/panel/konto`}>
                <SettingsIcon />
                <span>Konto</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
