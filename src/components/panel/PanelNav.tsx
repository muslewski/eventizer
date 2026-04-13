'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

function useSidebarHeight() {
  const [height, setHeight] = useState(`calc(100svh - ${HEADER_CLEARANCE}px)`)

  useEffect(() => {
    function update() {
      const scrollY = window.scrollY
      // Interpolate: at scroll 0 → 80px offset, at scroll 72+ → 8px offset
      const progress = Math.min(scrollY / (HEADER_CLEARANCE - STICKY_OFFSET), 1)
      const offset = HEADER_CLEARANCE - progress * (HEADER_CLEARANCE - STICKY_OFFSET)
      setHeight(`calc(100svh - ${offset}px)`)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return height
}

export function PanelNav({ user, lang }: PanelNavProps) {
  const pathname = usePathname()
  const sidebarHeight = useSidebarHeight()

  const isServiceProvider =
    user.role === 'service-provider' || user.role === 'admin' || user.role === 'moderator'
  const navItems = isServiceProvider ? serviceProviderNav : clientNav
  const roleLabel = isServiceProvider ? 'Usługodawca' : 'Klient'

  return (
    <Sidebar
      side="left"
      variant="floating"
      collapsible="icon"
      style={{ height: sidebarHeight }}
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
