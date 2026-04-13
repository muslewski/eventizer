'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useScroll, useTransform, useSpring } from 'motion/react'
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

// Header: top-4 (16px) + h-16 (64px) = 80px clearance
// Sticky offset: top-2 (8px)
const HEADER_CLEARANCE = 80
const STICKY_OFFSET = 8
const SCROLL_DISTANCE = HEADER_CLEARANCE - STICKY_OFFSET

export function PanelNav({ user, lang }: PanelNavProps) {
  const pathname = usePathname()
  const { scrollY } = useScroll()

  // MotionValue: smoothly interpolates height based on scroll position
  // At scroll 0: viewport minus header clearance (sidebar fits below header)
  // At scroll 72px+: viewport minus small sticky offset (sidebar fills screen)
  // motion.div in sidebar.tsx reads this directly — zero React re-renders
  // Map scroll → numeric offset for the spring to work with
  const rawOffset = useTransform(
    scrollY,
    [0, SCROLL_DISTANCE],
    [HEADER_CLEARANCE, STICKY_OFFSET],
  )

  // Spring-smoothed offset — gives that organic, weighty feel
  const smoothOffset = useSpring(rawOffset, { stiffness: 300, damping: 30, mass: 0.8 })

  // Convert numeric offset → CSS calc height string
  const sidebarHeight = useTransform(smoothOffset, (v) => `calc(100svh - ${v}px)`)

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
