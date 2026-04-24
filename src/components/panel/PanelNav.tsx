'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  PanelLeftIcon,
  LogOutIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useRootAuth } from '@/providers/RootAuthProvider'
import type { User } from '@/payload-types'

interface PanelNavProps {
  user: User
  lang: string
}

const serviceProviderNav = [
  { label: 'Panel główny', icon: LayoutDashboardIcon, route: '/panel/dashboard' },
  { label: 'Oferty', icon: FileTextIcon, route: '/panel/oferty' },
  { label: 'Plan subskrypcji', icon: CreditCardIcon, route: '/panel/plan-subskrypcji' },
  { label: 'Formularze', icon: InboxIcon, route: '/panel/formularze' },
  { label: 'Pomoc', icon: HelpCircleIcon, route: '/panel/pomoc' },
]

const clientNav = [
  { label: 'Panel główny', icon: LayoutDashboardIcon, route: '/panel/dashboard' },
  { label: 'Ulubione', icon: HeartIcon, route: '/panel/ulubione' },
  { label: 'Pomoc', icon: HelpCircleIcon, route: '/panel/pomoc' },
  { label: 'Zostań usługodawcą', icon: StarIcon, route: '/panel/plan-subskrypcji' },
]

// Sidebar wrapper pt-28 (112px) matches content area md:pt-28
// Sticky offset: top-2 (8px) + 8px bottom breathing room = 16px
// Both states: sidebar ends at 100svh - 8px (consistent bottom gap)
const HEADER_CLEARANCE = 112
const STICKY_OFFSET = 16
const SCROLL_DISTANCE = HEADER_CLEARANCE - STICKY_OFFSET

function LogoutButton({ lang }: { lang: string }) {
  const { logout } = useRootAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push(`/${lang}/auth/sign-in`)
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
        <LogOutIcon />
        <span>Wyloguj się</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function CollapseButton() {
  const { toggleSidebar } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={toggleSidebar}>
        <PanelLeftIcon />
        <span>Zwiń panel</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function PanelNav({ user, lang }: PanelNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { scrollY } = useScroll()

  // Asymmetric sidebar height animation:
  // - Scrolling DOWN: stays at short height, then SNAPS with spring at threshold
  // - Scrolling UP: smoothly interpolates back (gradual collapse)
  const offset = useMotionValue(HEADER_CLEARANCE)
  const prevScrollY = useRef(0)
  const isExpanded = useRef(false)
  const springControl = useRef<ReturnType<typeof animate> | null>(null)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = prevScrollY.current
    const scrollingDown = latest > prev
    prevScrollY.current = latest

    if (scrollingDown) {
      // Scrolling DOWN: binary snap at threshold
      if (latest >= SCROLL_DISTANCE && !isExpanded.current) {
        isExpanded.current = true
        // Cancel any running animation before starting snap
        springControl.current?.stop()
        springControl.current = animate(offset, STICKY_OFFSET, {
          type: 'spring',
          stiffness: 200,
          damping: 15,
          mass: 1.2,
        })
      }
    } else {
      // Scrolling UP: cancel any spring and follow scroll directly
      if (isExpanded.current && latest < SCROLL_DISTANCE) {
        isExpanded.current = false
        springControl.current?.stop()
      }

      if (!isExpanded.current) {
        // Map scroll position to offset with gentle spring follow
        const progress = Math.min(Math.max(0, latest / SCROLL_DISTANCE), 1)
        const target = HEADER_CLEARANCE - progress * (HEADER_CLEARANCE - STICKY_OFFSET)
        springControl.current?.stop()
        springControl.current = animate(offset, target, {
          type: 'spring',
          stiffness: 600,
          damping: 40,
          mass: 0.3,
        })
      }
    }
  })

  // Convert numeric offset → CSS calc height string
  const sidebarHeight = useTransform(offset, (v) => `calc(100svh - ${v}px)`)

  const isServiceProvider =
    user.role === 'service-provider' || user.role === 'admin' || user.role === 'moderator'
  const navItems = isServiceProvider ? serviceProviderNav : clientNav
  const roleLabel = isServiceProvider ? 'Usługodawca' : 'Klient'

  // Proactively warm up every panel route on mount so the router cache is
  // primed before the user clicks (belt-and-suspenders alongside Link's own
  // viewport prefetch).
  useEffect(() => {
    navItems.forEach((item) => router.prefetch(`/${lang}${item.route}`))
    router.prefetch(`/${lang}/panel/konto`)
  }, [router, lang, navItems])

  return (
    <Sidebar
      side="left"
      variant="floating"
      collapsible="icon"
      className="bg-transparent dark:bg-transparent [&>[data-slot=sidebar-inner]]:bg-base-50/55 dark:[&>[data-slot=sidebar-inner]]:bg-base-950/55 [&>[data-slot=sidebar-inner]]:border-accent/20 [&>[data-slot=sidebar-inner]]:backdrop-blur-xl [&>[data-slot=sidebar-inner]]:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]"
      style={{ height: sidebarHeight as unknown as string }}
    >
      <SidebarHeader>
        <Badge variant="outline" className="text-accent border-accent/30 justify-center group-data-[state=collapsed]:size-8 group-data-[state=collapsed]:rounded-full group-data-[state=collapsed]:p-0">
          <span className="group-data-[state=collapsed]:hidden">{roleLabel}</span>
          <span className="hidden group-data-[state=collapsed]:inline text-xs">{roleLabel[0]}</span>
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
                      <Link href={fullHref} prefetch>
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
      <Separator className="bg-accent/20" />
      <SidebarFooter>
        <SidebarMenu>
          <LogoutButton lang={lang} />
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith(`/${lang}/panel/konto`)}>
              <Link href={`/${lang}/panel/konto`} prefetch>
                <SettingsIcon />
                <span>Konto</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <CollapseButton />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
