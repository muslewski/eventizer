'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  animate,
} from 'motion/react'
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

// Header: top-4 (16px) + h-16 (64px) = 80px + 8px bottom breathing room = 88px
// Sticky offset: top-2 (8px) + 8px bottom breathing room = 16px
// Both states: sidebar ends at 100svh - 8px (consistent bottom gap)
const HEADER_CLEARANCE = 88
const STICKY_OFFSET = 16
const SCROLL_DISTANCE = HEADER_CLEARANCE - STICKY_OFFSET

export function PanelNav({ user, lang }: PanelNavProps) {
  const pathname = usePathname()
  const { scrollY } = useScroll()

  // Asymmetric sidebar height animation:
  // - Scrolling DOWN: stays at short height, then SNAPS with spring at threshold
  // - Scrolling UP: smoothly interpolates back (gradual collapse)
  const offset = useMotionValue(HEADER_CLEARANCE)
  const prevScrollY = useRef(0)
  const isExpanded = useRef(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = prevScrollY.current
    const scrollingDown = latest > prev
    prevScrollY.current = latest

    if (scrollingDown) {
      // Scrolling DOWN: binary snap at threshold
      if (latest >= SCROLL_DISTANCE && !isExpanded.current) {
        isExpanded.current = true
        animate(offset, STICKY_OFFSET, {
          type: 'spring',
          stiffness: 200,
          damping: 15,
          mass: 1.2,
        })
      }
      // Before threshold: stay at HEADER_CLEARANCE (don't interpolate)
    } else {
      // Scrolling UP: gradual interpolation
      if (latest < SCROLL_DISTANCE) {
        isExpanded.current = false
        const progress = Math.max(0, latest / SCROLL_DISTANCE)
        const target = HEADER_CLEARANCE - progress * (HEADER_CLEARANCE - STICKY_OFFSET)
        offset.set(target)
      } else if (latest < SCROLL_DISTANCE && isExpanded.current) {
        // Just crossed back above threshold
        isExpanded.current = false
      }
    }
  })

  // Convert numeric offset → CSS calc height string
  const sidebarHeight = useTransform(offset, (v) => `calc(100svh - ${v}px)`)

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
