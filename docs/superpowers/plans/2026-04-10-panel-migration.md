# Panel Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a custom shadcn-based `/panel` UI that replaces Payload admin for service providers and clients, while keeping Payload as the backend CMS.

**Architecture:** Server-first approach — panel lives inside `(frontend)/[lang]/panel/` inheriting the existing root layout. Server components fetch data via Payload Local API, mutations go through server actions. Client components handle interactive pieces (forms, sidebar state). Auth guard in panel layout checks Better Auth session.

**Tech Stack:** Next.js 16 App Router, Payload CMS 3.75 Local API, shadcn/ui (radix base, new-york style), react-hook-form + Zod, Lucide icons, Framer Motion, Tailwind CSS v4 semantic tokens.

**Spec:** `docs/superpowers/specs/2026-04-10-panel-migration-design.md`

**Key patterns from existing codebase:**
- Server actions: `'use server'`, `auth.api.getSession({ headers: await headers() })`, `getPayload({ config })`, return `{ success, error? }`
- Auth check: `auth.api.getSession()` server-side, `useRootAuth()` client-side
- Package manager: `pnpm`
- Frontend layout: `src/app/(frontend)/[lang]/layout.tsx` with `params: Promise<{ lang: string }>`
- Existing actions live in `src/actions/`

---

## File Structure

### New Files

```
src/app/(frontend)/[lang]/panel/
  layout.tsx                              — Auth guard + PanelShell wrapper
  dashboard/
    page.tsx                              — Role-aware dashboard (server component)
  oferty/
    page.tsx                              — Offer list (server component)
    [slug]/
      page.tsx                            — Offer detail (server component)
      edytuj/
        page.tsx                          — Edit wizard wrapper (server component)
    nowa/
      page.tsx                            — Create wizard wrapper (server component)
  plan-subskrypcji/
    page.tsx                              — Subscription management (server component)
  formularze/
    page.tsx                              — Submitted forms list (server component)
  pomoc/
    page.tsx                              — Help tickets (server component)
  konto/
    page.tsx                              — Account settings (server component)
  ulubione/
    page.tsx                              — Favorites (server component)

src/components/panel/
  PanelShell.tsx                          — SidebarProvider + Sidebar + SidebarInset (client)
  PanelNav.tsx                            — Role-aware nav items (client)
  PanelBreadcrumb.tsx                     — Reusable breadcrumb wrapper
  PanelMobileHeader.tsx                   — Mobile top bar with SidebarTrigger
  dashboard/
    ServiceProviderDashboard.tsx           — SP widgets (client)
    ClientDashboard.tsx                    — Client widgets (client)
  oferty/
    OfferCard.tsx                          — Compact offer card for list/grid
    OfferStatusFilter.tsx                  — ToggleGroup filter (client)
    OfferDetailView.tsx                    — Read-only offer detail display
    OfferStatusToggle.tsx                  — AlertDialog status toggle (client)
  wizard/
    OfferWizardForm.tsx                    — Multi-step form controller (client)
    steps/
      StepBasicInfo.tsx                    — Step 1: title, category, short desc
      StepPricing.tsx                      — Step 2: price, location, radius
      StepMedia.tsx                        — Step 3: images, video
      StepDescription.tsx                  — Step 4: description, contact, socials
      StepSummary.tsx                      — Step 5: review + submit
    offerSchema.ts                         — Zod schema for all fields
    CategoryPicker.tsx                     — Hierarchical category picker (client)
  plan-subskrypcji/
    SubscriptionManager.tsx                — State-aware subscription page (client)
    PlanCard.tsx                           — Subscription plan card
  formularze/
    FormularzeTable.tsx                    — Table + Sheet detail view (client)
  pomoc/
    PomocTable.tsx                         — Tickets table (client)
    NewTicketDialog.tsx                    — Dialog with form (client)
  konto/
    AccountSettings.tsx                    — Profile, password, subscription info (client)
  ulubione/
    FavoritesGrid.tsx                      — Favorites grid with toggle (client)

src/actions/panel/
  offers.ts                               — getOffers, getOffer, createOffer, updateOffer, toggleOfferStatus
  forms.ts                                — getSubmittedForms, updateFormStatus
  help.ts                                 — getHelpTickets, createHelpTicket
  account.ts                              — updateAccount
  dashboard.ts                            — getDashboardStats
  favorites.ts                            — toggleFavorite, getFavorites
```

### Modified Files

```
src/collections/auth/Users/index.ts       — Add favorites field
src/styles/global.css                      — Add sidebar CSS variables
```

---

## Phase 1: Foundation

### Task 1: Install shadcn components

**Files:**
- Modify: `src/components/ui/` (new component files added by CLI)
- Modify: `src/styles/global.css` (sidebar CSS variables)

- [ ] **Step 1: Install all required shadcn components**

```bash
pnpm dlx shadcn@latest add sidebar field input-group toggle-group table sheet progress switch slider breadcrumb spinner empty checkbox radio-group
```

- [ ] **Step 2: Verify installation**

```bash
ls src/components/ui/sidebar.tsx src/components/ui/field.tsx src/components/ui/input-group.tsx src/components/ui/toggle-group.tsx src/components/ui/table.tsx src/components/ui/sheet.tsx src/components/ui/progress.tsx src/components/ui/switch.tsx src/components/ui/slider.tsx src/components/ui/breadcrumb.tsx src/components/ui/spinner.tsx src/components/ui/empty.tsx src/components/ui/checkbox.tsx src/components/ui/radio-group.tsx
```

Expected: All files exist.

- [ ] **Step 3: Add sidebar CSS variables to global.css**

Open `src/styles/global.css` and add the sidebar theme variables inside the existing `:root` / `.dark` blocks (or as a `@theme inline` block if Tailwind v4). The shadcn Sidebar component expects these CSS variables:

```css
--sidebar-background: var(--background);
--sidebar-foreground: var(--foreground);
--sidebar-primary: var(--accent);
--sidebar-primary-foreground: var(--accent-foreground);
--sidebar-accent: var(--accent);
--sidebar-accent-foreground: var(--accent-foreground);
--sidebar-border: var(--border);
--sidebar-ring: var(--ring);
```

Check if the Sidebar component install already added these. If so, adjust the values to map to the Eventizer accent (copper/gold). If not, add them.

- [ ] **Step 4: Verify dev server starts without errors**

```bash
pnpm dev
```

Expected: No build errors related to new components.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(panel): install shadcn sidebar, field, table, and 11 other components"
```

---

### Task 2: Add favorites field to Users collection

**Files:**
- Modify: `src/collections/auth/Users/index.ts`

- [ ] **Step 1: Add the favorites field to the Users collection**

Open `src/collections/auth/Users/index.ts`. In the `fields` array, add after the existing user fields (near the bottom, before any admin-only fields):

```typescript
{
  name: 'favorites',
  type: 'relationship',
  relationTo: 'offers',
  hasMany: true,
  defaultValue: [],
  label: { pl: 'Ulubione oferty', en: 'Favorite offers' },
  access: {
    update: fieldRoleOrHigherOrSelf('client'),
  },
  admin: {
    position: 'sidebar',
    condition: (data) => data?.role === 'client' || data?.role === 'service-provider',
  },
},
```

Import `fieldRoleOrHigherOrSelf` from `@/access` if not already imported.

- [ ] **Step 2: Run database migration**

```bash
pnpm dev
```

Payload auto-migrates on dev start. Verify no migration errors in terminal output.

- [ ] **Step 3: Verify field exists in Payload admin**

Navigate to `/app` → Users → edit any user → check that "Ulubione oferty" field appears in the sidebar.

- [ ] **Step 4: Commit**

```bash
git add src/collections/auth/Users/index.ts && git commit -m "feat(panel): add favorites relationship field to Users collection"
```

---

### Task 3: Panel layout, auth guard, and sidebar shell

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/layout.tsx`
- Create: `src/components/panel/PanelShell.tsx`
- Create: `src/components/panel/PanelNav.tsx`
- Create: `src/components/panel/PanelMobileHeader.tsx`
- Create: `src/components/panel/PanelBreadcrumb.tsx`

- [ ] **Step 1: Create the panel layout with auth guard**

Create `src/app/(frontend)/[lang]/panel/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { PanelShell } from '@/components/panel/PanelShell'

export default async function PanelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  const payload = await getPayload({ config })
  const payloadUser = await payload.findByID({
    collection: 'users',
    id: Number(session.user.id),
    depth: 0,
  })

  if (!payloadUser) {
    redirect(`/${lang}/auth/sign-in`)
  }

  return (
    <PanelShell user={payloadUser} lang={lang}>
      {children}
    </PanelShell>
  )
}
```

- [ ] **Step 2: Create the PanelShell client component**

Create `src/components/panel/PanelShell.tsx`:

```tsx
'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { PanelNav } from './PanelNav'
import { PanelMobileHeader } from './PanelMobileHeader'
import type { User } from '@/payload-types'

interface PanelShellProps {
  user: User
  lang: string
  children: React.ReactNode
}

export function PanelShell({ user, lang, children }: PanelShellProps) {
  return (
    <SidebarProvider>
      <PanelNav user={user} lang={lang} />
      <SidebarInset>
        <PanelMobileHeader user={user} />
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

- [ ] **Step 3: Create the PanelNav sidebar component**

Create `src/components/panel/PanelNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboardIcon,
  FileTextIcon,
  CreditCardIcon,
  InboxIcon,
  HelpCircleIcon,
  SettingsIcon,
  HeartIcon,
  StarIcon,
} from 'lucide-react'
import type { User } from '@/payload-types'

const serviceProviderItems = [
  { label: 'Dashboard', icon: LayoutDashboardIcon, href: '/panel/dashboard' },
  { label: 'Oferty', icon: FileTextIcon, href: '/panel/oferty' },
  { label: 'Plan subskrypcji', icon: CreditCardIcon, href: '/panel/plan-subskrypcji' },
  { label: 'Formularze', icon: InboxIcon, href: '/panel/formularze' },
  { label: 'Pomoc', icon: HelpCircleIcon, href: '/panel/pomoc' },
]

const clientItems = [
  { label: 'Dashboard', icon: LayoutDashboardIcon, href: '/panel/dashboard' },
  { label: 'Ulubione', icon: HeartIcon, href: '/panel/ulubione' },
  { label: 'Pomoc', icon: HelpCircleIcon, href: '/panel/pomoc' },
  { label: 'Zostań usługodawcą', icon: StarIcon, href: '/panel/plan-subskrypcji' },
]

interface PanelNavProps {
  user: User
  lang: string
}

export function PanelNav({ user, lang }: PanelNavProps) {
  const pathname = usePathname()
  const isServiceProvider = user.role === 'service-provider' || user.role === 'admin' || user.role === 'moderator'
  const navItems = isServiceProvider ? serviceProviderItems : clientItems

  const roleLabel = isServiceProvider ? 'Usługodawca' : 'Klient'

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Badge variant="outline" className="text-accent border-accent/30">
            <StarIcon data-icon="inline-start" />
            {roleLabel}
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Nawigacja</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const fullHref = `/${lang}${item.href}`
                const isActive = pathname.startsWith(fullHref)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
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
            <SidebarMenuButton asChild isActive={pathname.includes('/panel/konto')}>
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
```

- [ ] **Step 4: Create the PanelMobileHeader component**

Create `src/components/panel/PanelMobileHeader.tsx`:

```tsx
'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { StarIcon } from 'lucide-react'
import type { User } from '@/payload-types'

interface PanelMobileHeaderProps {
  user: User
}

export function PanelMobileHeader({ user }: PanelMobileHeaderProps) {
  const isServiceProvider = user.role === 'service-provider' || user.role === 'admin' || user.role === 'moderator'
  const roleLabel = isServiceProvider ? 'Usługodawca' : 'Klient'

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Badge variant="outline" className="text-accent border-accent/30">
        <StarIcon data-icon="inline-start" />
        {roleLabel}
      </Badge>
    </header>
  )
}
```

- [ ] **Step 5: Create the PanelBreadcrumb component**

Create `src/components/panel/PanelBreadcrumb.tsx`:

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'

interface BreadcrumbSegment {
  label: string
  href?: string
}

interface PanelBreadcrumbProps {
  segments: BreadcrumbSegment[]
  lang: string
}

export function PanelBreadcrumb({ segments, lang }: PanelBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${lang}/panel/dashboard`}>Panel</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, i) => (
          <span key={segment.label} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {segment.href ? (
                <BreadcrumbLink asChild>
                  <Link href={`/${lang}${segment.href}`}>{segment.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
```

- [ ] **Step 6: Create a placeholder dashboard page to verify the shell works**

Create `src/app/(frontend)/[lang]/panel/dashboard/page.tsx`:

```tsx
export default async function DashboardPage() {
  return (
    <div>
      <h1 className="font-bebas text-3xl tracking-wide">Dashboard</h1>
      <p className="text-muted-foreground">Panel działa poprawnie.</p>
    </div>
  )
}
```

- [ ] **Step 7: Test the panel shell**

```bash
pnpm dev
```

1. Navigate to `/pl/panel/dashboard` — should see the sidebar + placeholder content
2. If not logged in, should redirect to `/pl/auth/sign-in`
3. Test mobile view — sidebar should be hidden, hamburger trigger visible
4. Test sidebar collapse on desktop (Ctrl+B / Cmd+B)
5. Verify nav items match the user's role

- [ ] **Step 8: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/ src/components/panel/ && git commit -m "feat(panel): add panel layout with auth guard, sidebar shell, and navigation"
```

---

## Phase 2: Data Layer

### Task 4: Create all panel server actions

**Files:**
- Create: `src/actions/panel/offers.ts`
- Create: `src/actions/panel/forms.ts`
- Create: `src/actions/panel/help.ts`
- Create: `src/actions/panel/account.ts`
- Create: `src/actions/panel/dashboard.ts`
- Create: `src/actions/panel/favorites.ts`

- [ ] **Step 1: Create offers actions**

Create `src/actions/panel/offers.ts`:

```typescript
'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import type { Offer } from '@/payload-types'

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function getOffers(userId: number) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'offers',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      depth: 1,
      draft: true,
    })
    return { success: true as const, data: result.docs }
  } catch (error) {
    console.error('[getOffers]', error)
    return { success: false as const, error: 'Nie udało się pobrać ofert' }
  }
}

export async function getOffer(slug: string, userId: number) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'offers',
      where: {
        link: { equals: slug },
        user: { equals: userId },
      },
      limit: 1,
      depth: 2,
      draft: true,
    })
    if (!result.docs[0]) return { success: false as const, error: 'Nie znaleziono oferty' }
    return { success: true as const, data: result.docs[0] }
  } catch (error) {
    console.error('[getOffer]', error)
    return { success: false as const, error: 'Nie udało się pobrać oferty' }
  }
}

export async function createOffer(data: Partial<Offer>) {
  try {
    const user = await getAuthenticatedUser()
    const payload = await getPayload({ config })
    const result = await payload.create({
      collection: 'offers',
      data: { ...data, user: Number(user.id) },
      draft: true,
    })
    return { success: true as const, data: result }
  } catch (error) {
    console.error('[createOffer]', error)
    const message = error instanceof Error ? error.message : 'Nie udało się utworzyć oferty'
    return { success: false as const, error: message }
  }
}

export async function updateOffer(id: number, data: Partial<Offer>) {
  try {
    await getAuthenticatedUser()
    const payload = await getPayload({ config })
    const result = await payload.update({
      collection: 'offers',
      id,
      data,
    })
    return { success: true as const, data: result }
  } catch (error) {
    console.error('[updateOffer]', error)
    const message = error instanceof Error ? error.message : 'Nie udało się zaktualizować oferty'
    return { success: false as const, error: message }
  }
}

export async function toggleOfferStatus(id: number, currentStatus: string) {
  try {
    await getAuthenticatedUser()
    const payload = await getPayload({ config })
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    const result = await payload.update({
      collection: 'offers',
      id,
      data: { _status: newStatus },
    })
    return { success: true as const, data: result }
  } catch (error) {
    console.error('[toggleOfferStatus]', error)
    return { success: false as const, error: 'Nie udało się zmienić statusu oferty' }
  }
}
```

- [ ] **Step 2: Create forms actions**

Create `src/actions/panel/forms.ts`:

```typescript
'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function getSubmittedForms(providerId: number) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'submitted-forms',
      where: { provider: { equals: providerId } },
      sort: '-createdAt',
      depth: 1,
    })
    return { success: true as const, data: result.docs }
  } catch (error) {
    console.error('[getSubmittedForms]', error)
    return { success: false as const, error: 'Nie udało się pobrać formularzy' }
  }
}

export async function updateFormStatus(id: number, status: 'new' | 'read' | 'replied') {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'submitted-forms',
      id,
      data: { status },
    })
    return { success: true as const }
  } catch (error) {
    console.error('[updateFormStatus]', error)
    return { success: false as const, error: 'Nie udało się zaktualizować statusu' }
  }
}
```

- [ ] **Step 3: Create help actions**

Create `src/actions/panel/help.ts`:

```typescript
'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function getHelpTickets(userId: number) {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'help-tickets',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      depth: 0,
    })
    return { success: true as const, data: result.docs }
  } catch (error) {
    console.error('[getHelpTickets]', error)
    return { success: false as const, error: 'Nie udało się pobrać zgłoszeń' }
  }
}

export async function createHelpTicket(data: {
  title: string
  email: string
  description: string
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    await payload.create({
      collection: 'help-tickets',
      data: {
        title: data.title,
        email: data.email,
        description: data.description,
        user: Number(session.user.id),
      },
    })
    return { success: true as const }
  } catch (error) {
    console.error('[createHelpTicket]', error)
    return { success: false as const, error: 'Nie udało się utworzyć zgłoszenia' }
  }
}
```

- [ ] **Step 4: Create account actions**

Create `src/actions/panel/account.ts`:

```typescript
'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function updateAccount(data: { name?: string }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'users',
      id: Number(session.user.id),
      data,
    })
    return { success: true as const }
  } catch (error) {
    console.error('[updateAccount]', error)
    return { success: false as const, error: 'Nie udało się zaktualizować konta' }
  }
}
```

- [ ] **Step 5: Create dashboard stats action**

Create `src/actions/panel/dashboard.ts`:

```typescript
'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

export async function getDashboardStats(userId: number, role: string) {
  try {
    const payload = await getPayload({ config })

    const isProvider = role === 'service-provider' || role === 'admin' || role === 'moderator'

    if (isProvider) {
      const [offersResult, formsResult, subscriptionDetails] = await Promise.all([
        payload.find({
          collection: 'offers',
          where: { user: { equals: userId } },
          depth: 0,
          draft: true,
        }),
        payload.find({
          collection: 'submitted-forms',
          where: { provider: { equals: userId }, status: { equals: 'new' } },
          depth: 0,
        }),
        getCurrentSubscriptionDetails(userId),
      ])

      const offers = offersResult.docs
      const publishedCount = offers.filter((o) => o._status === 'published').length
      const draftCount = offers.filter((o) => o._status === 'draft').length

      return {
        success: true as const,
        data: {
          role: 'service-provider' as const,
          offers: {
            total: offers.length,
            published: publishedCount,
            draft: draftCount,
          },
          newFormsCount: formsResult.totalDocs,
          subscription: subscriptionDetails,
        },
      }
    }

    // Client stats
    const [ticketsResult, userRecord] = await Promise.all([
      payload.find({
        collection: 'help-tickets',
        where: { user: { equals: userId }, isSolved: { equals: false } },
        depth: 0,
      }),
      payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
      }),
    ])

    return {
      success: true as const,
      data: {
        role: 'client' as const,
        openTickets: ticketsResult.totalDocs,
        favoritesCount: (userRecord.favorites as number[])?.length || 0,
      },
    }
  } catch (error) {
    console.error('[getDashboardStats]', error)
    return { success: false as const, error: 'Nie udało się pobrać statystyk' }
  }
}
```

- [ ] **Step 6: Create favorites actions**

Create `src/actions/panel/favorites.ts`:

```typescript
'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function toggleFavorite(offerId: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })
    const userId = Number(session.user.id)

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    const currentFavorites = (user.favorites as number[]) || []
    const isFavorited = currentFavorites.includes(offerId)
    const newFavorites = isFavorited
      ? currentFavorites.filter((id) => id !== offerId)
      : [...currentFavorites, offerId]

    await payload.update({
      collection: 'users',
      id: userId,
      data: { favorites: newFavorites },
    })

    return { success: true as const, isFavorited: !isFavorited }
  } catch (error) {
    console.error('[toggleFavorite]', error)
    return { success: false as const, error: 'Nie udało się zaktualizować ulubionych' }
  }
}

export async function getFavorites(userId: number) {
  try {
    const payload = await getPayload({ config })
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    const favoriteIds = (user.favorites as number[]) || []
    if (favoriteIds.length === 0) return { success: true as const, data: [] }

    const result = await payload.find({
      collection: 'offers',
      where: { id: { in: favoriteIds }, _status: { equals: 'published' } },
      depth: 1,
    })

    return { success: true as const, data: result.docs }
  } catch (error) {
    console.error('[getFavorites]', error)
    return { success: false as const, error: 'Nie udało się pobrać ulubionych' }
  }
}
```

- [ ] **Step 7: Verify all actions compile**

```bash
pnpm build 2>&1 | head -50
```

Expected: No TypeScript errors in `src/actions/panel/`. If there are type issues with Payload types, fix them using the generated types from `@/payload-types`.

- [ ] **Step 8: Commit**

```bash
git add src/actions/panel/ && git commit -m "feat(panel): add all panel server actions — offers, forms, help, account, dashboard, favorites"
```

---

## Phase 3: Core Pages

### Task 5: Dashboard page

**Files:**
- Modify: `src/app/(frontend)/[lang]/panel/dashboard/page.tsx`
- Create: `src/components/panel/dashboard/ServiceProviderDashboard.tsx`
- Create: `src/components/panel/dashboard/ClientDashboard.tsx`

- [ ] **Step 1: Build the dashboard server page**

Replace `src/app/(frontend)/[lang]/panel/dashboard/page.tsx`:

This is the server component that fetches stats and renders the appropriate dashboard based on role. Use `getDashboardStats()` from the actions we created. Render `<ServiceProviderDashboard>` or `<ClientDashboard>` based on the user's role.

The server page needs access to the authenticated user. Since the panel layout already checks auth and passes user to PanelShell, the dashboard page needs to re-fetch the user server-side (server components can't receive context from client parents). Use `auth.api.getSession()` + `payload.findByID()` to get the current user.

- [ ] **Step 2: Build ServiceProviderDashboard client component**

Create `src/components/panel/dashboard/ServiceProviderDashboard.tsx`:

Uses shadcn components per spec:
- `Card` with `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` for each stat widget
- `Badge` for status indicators and counts
- `Button` with `<PlusIcon data-icon="inline-start" />` for "Dodaj ofertę" quick action
- `Alert` + `AlertTitle` + `AlertDescription` for subscription expiring, offer limit reached, draft reminders
- `Empty` + `EmptyHeader` + `EmptyMedia` + `EmptyTitle` + `EmptyDescription` + `EmptyContent` for no-offers state
- `Tooltip` on disabled "Dodaj ofertę" button when at limit
- `Skeleton` for loading states
- All spacing with `gap-*`, never `space-y-*`
- Semantic colors only (`text-muted-foreground`, `bg-card`, etc.)

Receive stats data as props from the server page (not as client-side fetches).

- [ ] **Step 3: Build ClientDashboard client component**

Create `src/components/panel/dashboard/ClientDashboard.tsx`:

Simpler layout:
- `Card` for favorites count with recent favorite offer mini-cards
- `Card` for open help tickets count
- Prominent CTA `Card` for "Zostań usługodawcą" with `Button` and `StarIcon`
- Quick links to frontend browsing categories
- `Empty` state when no favorites

Receive stats data as props from the server page.

- [ ] **Step 4: Verify dashboard renders correctly**

```bash
pnpm dev
```

Navigate to `/pl/panel/dashboard`. Verify:
- Service provider sees stat widgets, alerts, quick actions
- Client sees lighter dashboard with CTA
- Responsive layout works on mobile
- Sidebar is functional

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/dashboard/ src/components/panel/dashboard/ && git commit -m "feat(panel): add role-aware dashboard with stat widgets and alerts"
```

---

### Task 6: Offers list page

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/oferty/page.tsx`
- Create: `src/components/panel/oferty/OfferCard.tsx`
- Create: `src/components/panel/oferty/OfferStatusFilter.tsx`

- [ ] **Step 1: Build the offers list server page**

Create `src/app/(frontend)/[lang]/panel/oferty/page.tsx`:

Server component that:
1. Checks auth + role (redirect clients to `/panel/dashboard`)
2. Fetches user's offers via `getOffers(userId)`
3. Fetches user's `maxOffers` from the Payload user record
4. Renders `PanelBreadcrumb` with segments `[{ label: 'Oferty' }]`
5. Renders "Dodaj ofertę" `Button` (disabled with `Tooltip` if `offers.length >= maxOffers`)
6. Passes offers data to client component for filtering

- [ ] **Step 2: Build OfferCard component**

Create `src/components/panel/oferty/OfferCard.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PencilIcon, ExternalLinkIcon } from 'lucide-react'
import type { Offer } from '@/payload-types'

interface OfferCardProps {
  offer: Offer
  lang: string
}

export function OfferCard({ offer, lang }: OfferCardProps) {
  const isPublished = offer._status === 'published'
  const mainImageUrl = typeof offer.mainImage === 'object' ? offer.mainImage?.url : null

  return (
    <Card>
      <CardHeader className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-t-xl">
          {mainImageUrl ? (
            <Image src={mainImageUrl} alt={offer.title} fill className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-content-center bg-muted" />
          )}
          <Badge
            variant={isPublished ? 'default' : 'secondary'}
            className="absolute right-2 top-2"
          >
            {isPublished ? 'Opublikowana' : 'Robocza'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4">
        <h3 className="font-bebas text-xl tracking-wide">{offer.title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{offer.categoryName}</Badge>
          <span className="text-sm text-muted-foreground">
            {offer.price} PLN
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${lang}/panel/oferty/${offer.link}`}>
            <PencilIcon data-icon="inline-start" />
            Zarządzaj
          </Link>
        </Button>
        {isPublished && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${lang}/ogloszenia/${offer.link}`} target="_blank">
              <ExternalLinkIcon data-icon="inline-start" />
              Podgląd
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 3: Build OfferStatusFilter component**

Create `src/components/panel/oferty/OfferStatusFilter.tsx`:

```tsx
'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface OfferStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function OfferStatusFilter({ value, onChange }: OfferStatusFilterProps) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v)}>
      <ToggleGroupItem value="all">Wszystkie</ToggleGroupItem>
      <ToggleGroupItem value="published">Opublikowane</ToggleGroupItem>
      <ToggleGroupItem value="draft">Robocze</ToggleGroupItem>
    </ToggleGroup>
  )
}
```

- [ ] **Step 4: Verify offers list**

Navigate to `/pl/panel/oferty`. Verify grid displays, filter works, empty state shows correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/oferty/page.tsx src/components/panel/oferty/ && git commit -m "feat(panel): add offers list page with card grid and status filter"
```

---

### Task 7: Offer detail page

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/oferty/[slug]/page.tsx`
- Create: `src/components/panel/oferty/OfferDetailView.tsx`
- Create: `src/components/panel/oferty/OfferStatusToggle.tsx`

- [ ] **Step 1: Build the offer detail server page**

Create `src/app/(frontend)/[lang]/panel/oferty/[slug]/page.tsx`:

Server component that:
1. Gets `slug` from params
2. Fetches the offer via `getOffer(slug, userId)` with ownership check
3. If not found → `notFound()`
4. Renders `PanelBreadcrumb` with segments `[{ label: 'Oferty', href: '/panel/oferty' }, { label: offer.title }]`
5. Renders `OfferDetailView` with the offer data

- [ ] **Step 2: Build OfferDetailView component**

Create `src/components/panel/oferty/OfferDetailView.tsx`:

Read-only management view per spec:
- Hero area with `next/image` for main image, title in `font-bebas`, `Badge` for status
- Info `Card` grid (4 cards: category, price, location, service radius)
- Description `Card` with rendered Lexical rich text
- Media gallery `Card` with `next/image` grid
- Contact `Card` with phone, email, social links
- Action buttons: "Edytuj" `Button` linking to `./edytuj`, "Podgląd na stronie" `Button`, `OfferStatusToggle`

- [ ] **Step 3: Build OfferStatusToggle component**

Create `src/components/panel/oferty/OfferStatusToggle.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toggleOfferStatus } from '@/actions/panel/offers'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OfferStatusToggleProps {
  offerId: number
  currentStatus: string
}

export function OfferStatusToggle({ offerId, currentStatus }: OfferStatusToggleProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isPublished = currentStatus === 'published'

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleOfferStatus(offerId, currentStatus)
      if (result.success) {
        toast.success(isPublished ? 'Oferta wycofana z publikacji' : 'Oferta opublikowana')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isPublished ? 'Wycofaj z publikacji' : 'Opublikuj'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPublished ? 'Wycofać ofertę?' : 'Opublikować ofertę?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPublished
              ? 'Oferta nie będzie widoczna dla klientów.'
              : 'Oferta będzie widoczna publicznie.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle}>
            {isPublished ? 'Wycofaj' : 'Opublikuj'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 4: Verify offer detail page**

Navigate to `/pl/panel/oferty/[slug]` for an existing offer. Verify info cards, images, action buttons, and status toggle dialog.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/oferty/\[slug\]/page.tsx src/components/panel/oferty/OfferDetailView.tsx src/components/panel/oferty/OfferStatusToggle.tsx && git commit -m "feat(panel): add offer detail page with status toggle"
```

---

### Task 8: Offer wizard (create + edit)

This is the most complex task. The wizard is a single `OfferWizardForm` client component used by both create and edit routes.

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/oferty/nowa/page.tsx`
- Create: `src/app/(frontend)/[lang]/panel/oferty/[slug]/edytuj/page.tsx`
- Create: `src/components/panel/wizard/offerSchema.ts`
- Create: `src/components/panel/wizard/OfferWizardForm.tsx`
- Create: `src/components/panel/wizard/steps/StepBasicInfo.tsx`
- Create: `src/components/panel/wizard/steps/StepPricing.tsx`
- Create: `src/components/panel/wizard/steps/StepMedia.tsx`
- Create: `src/components/panel/wizard/steps/StepDescription.tsx`
- Create: `src/components/panel/wizard/steps/StepSummary.tsx`
- Create: `src/components/panel/wizard/CategoryPicker.tsx`

- [ ] **Step 1: Create the Zod schema**

Create `src/components/panel/wizard/offerSchema.ts`:

Define a Zod schema that matches the Offers collection fields. The schema should validate all 5 wizard steps. Use `z.object()` with fields: `title`, `category` (string path), `shortDescription`, `hasPriceRange`, `price`, `priceFrom`, `priceTo`, `location` (group), `serviceRadius`, `mainImage` (file), `gallery`, `video`, `videoAspectRatio`, `description` (rich text JSON), `phone`, `email`, `socialMedia` (group).

Use `.superRefine()` for conditional validation (e.g., price/priceFrom/priceTo based on `hasPriceRange`).

Export per-step sub-schemas for step-level validation:
```typescript
export const stepBasicInfoSchema = offerSchema.pick({ title: true, category: true, shortDescription: true })
export const stepPricingSchema = offerSchema.pick({ hasPriceRange: true, price: true, priceFrom: true, priceTo: true, location: true, serviceRadius: true })
// ... etc
```

- [ ] **Step 2: Create the wizard controller**

Create `src/components/panel/wizard/OfferWizardForm.tsx`:

```tsx
'use client'

// Multi-step form controller
// - Manages current step (0-4)
// - Single react-hook-form instance with full offerSchema
// - Progress component at top showing step/5
// - Per-step validation before allowing "Dalej"
// - "Wstecz" / "Dalej" navigation buttons
// - On final step: "Opublikuj" and "Zapisz jako roboczą" buttons
// - Calls createOffer() or updateOffer() server action on submit
// - toast() on success/error
// - Spinner inside submit button during pending

interface OfferWizardFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<Offer>  // Pre-populated for edit mode
  offerId?: number               // For edit mode updates
  categories: ServiceCategory[]  // Fetched server-side, passed as prop
  lang: string
}
```

The controller renders one of 5 step components based on `currentStep` state. Each step receives the react-hook-form `control`, `errors`, and `watch`/`setValue` helpers.

- [ ] **Step 3: Create Step 1 — StepBasicInfo**

Create `src/components/panel/wizard/steps/StepBasicInfo.tsx`:

Uses `FieldGroup` + `Field` + `FieldLabel` + `FieldError` composition:
- Title: `InputGroup` + `InputGroupInput` + `InputGroupAddon` (char counter)
- Category: `CategoryPicker` (hierarchical, reusing existing logic)
- Short description: `Textarea`

All controlled via react-hook-form `Controller`.

- [ ] **Step 4: Create Step 2 — StepPricing**

Create `src/components/panel/wizard/steps/StepPricing.tsx`:

- Price range toggle: `Switch` in `Field` wrapper
- Price fields: `InputGroup` + `InputGroupInput type="number"` + `InputGroupAddon align="inline-end"` showing "PLN"
- Conditional: show single price or from/to based on `hasPriceRange`
- Location: Reuse existing location picker component (adapt from `payload/fields/locationPicker`)
- Service radius: `Slider` (min=1, max=500) + `FieldDescription` showing `"{value} km"`

- [ ] **Step 5: Create Step 3 — StepMedia**

Create `src/components/panel/wizard/steps/StepMedia.tsx`:

- Main image: File upload dropzone with `next/image` preview
- Gallery: Multi-image upload
- Video: File upload with size limit display (`FieldDescription` "Max 50MB")
- Video aspect ratio (conditional): `ToggleGroup type="single"` with `ToggleGroupItem` for 16:9, 9:16, 1:1
- Background image: Optional file upload

File uploads should use the existing Payload upload patterns — upload to `offer-uploads` or `offer-video-uploads` collections via the Payload REST API or a dedicated upload action.

- [ ] **Step 6: Create Step 4 — StepDescription**

Create `src/components/panel/wizard/steps/StepDescription.tsx`:

- Rich text editor: Integrate Lexical editor with `offerLexical` config. This is the most complex field — it needs to work with react-hook-form.
- Phone: `InputGroup` with `PhoneIcon` `InputGroupAddon`
- Email: `InputGroup` with `MailIcon` `InputGroupAddon`
- Social media: `FieldSet` with `FieldLegend` "Media społecznościowe" + individual `Field`s for facebook, instagram, tiktok, linkedin (each as `InputGroup` with link addon)

- [ ] **Step 7: Create Step 5 — StepSummary**

Create `src/components/panel/wizard/steps/StepSummary.tsx`:

Read-only review displaying all form values in `Card` sections. Uses `next/image` for image previews. Shows action buttons: "Opublikuj" `Button` with `Spinner` during submission, "Zapisz jako roboczą" `Button variant="outline"`.

- [ ] **Step 8: Create CategoryPicker**

Create `src/components/panel/wizard/CategoryPicker.tsx`:

Adapt the existing `CategorySelection` component from `src/components/payload/views/serviceProviderOnboarding/categorySelection/index.tsx` to work with shadcn components and react-hook-form. The picker uses 3-level nesting with breadcrumb navigation and search.

Key differences from the existing component:
- Uses shadcn `Card`, `Input`, `Badge`, `Breadcrumb` instead of Payload admin UI
- Controlled via react-hook-form `Controller`
- Emits category path array for the form value

- [ ] **Step 9: Create the create wizard page**

Create `src/app/(frontend)/[lang]/panel/oferty/nowa/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { PanelBreadcrumb } from '@/components/panel/PanelBreadcrumb'
import { OfferWizardForm } from '@/components/panel/wizard/OfferWizardForm'

export default async function CreateOfferPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/${lang}/auth/sign-in`)

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: Number(session.user.id), depth: 0 })

  if (user.role === 'client') redirect(`/${lang}/panel/dashboard`)

  const categoriesResult = await payload.find({
    collection: 'service-categories',
    depth: 2,
    sort: 'name',
    limit: 100,
  })

  return (
    <div className="flex flex-col gap-6">
      <PanelBreadcrumb
        lang={lang}
        segments={[
          { label: 'Oferty', href: '/panel/oferty' },
          { label: 'Nowa oferta' },
        ]}
      />
      <h1 className="font-bebas text-3xl tracking-wide">Nowa oferta</h1>
      <OfferWizardForm
        mode="create"
        categories={categoriesResult.docs}
        lang={lang}
      />
    </div>
  )
}
```

- [ ] **Step 10: Create the edit wizard page**

Create `src/app/(frontend)/[lang]/panel/oferty/[slug]/edytuj/page.tsx`:

Similar to create page but:
1. Fetches the existing offer via `getOffer(slug, userId)`
2. If not found → `notFound()`
3. Passes `initialData={offer}` and `offerId={offer.id}` to `OfferWizardForm` with `mode="edit"`
4. Breadcrumb: Panel / Oferty / [Title] / Edytuj

- [ ] **Step 11: Verify wizard flow**

Test the full wizard:
1. Navigate to `/pl/panel/oferty/nowa` → verify all 5 steps
2. Fill in each step, verify per-step validation
3. Submit as draft → verify toast + redirect to offer detail
4. Navigate to `/pl/panel/oferty/[slug]/edytuj` → verify pre-populated
5. Modify and save → verify update works

- [ ] **Step 12: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/oferty/nowa/ src/app/\(frontend\)/\[lang\]/panel/oferty/\[slug\]/edytuj/ src/components/panel/wizard/ && git commit -m "feat(panel): add offer creation and edit wizard with 5-step form"
```

---

## Phase 4: Secondary Pages

### Task 9: Subscription & onboarding page

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx`
- Create: `src/components/panel/plan-subskrypcji/SubscriptionManager.tsx`
- Create: `src/components/panel/plan-subskrypcji/PlanCard.tsx`

- [ ] **Step 1: Build the subscription server page**

Create `src/app/(frontend)/[lang]/panel/plan-subskrypcji/page.tsx`:

Server component that:
1. Fetches user, subscription details via `getCurrentSubscriptionDetails(userId)`
2. Fetches service categories (depth 2) and subscription plans
3. Determines state: onboarding / active / expired
4. Checks `BETA_MODE` env var
5. Renders `PanelBreadcrumb` + `SubscriptionManager` with all data as props

- [ ] **Step 2: Build SubscriptionManager client component**

Create `src/components/panel/plan-subskrypcji/SubscriptionManager.tsx`:

State-aware component that renders one of three views:
- **Onboarding**: `Progress` bar (step 1/2 or 2/2), `CategoryPicker` (reuse from wizard), then plan selection
- **Active**: Current plan `Card` with `Badge` status, change plan/category `Button`s
- **Expired**: `Alert` with `AlertTriangleIcon`, renewal `Button`

Reuses existing `createCheckoutSession()`, `updateSubscription()`, `activateBetaAccess()` actions.

- [ ] **Step 3: Build PlanCard component**

Create `src/components/panel/plan-subskrypcji/PlanCard.tsx`:

`Card` per subscription plan:
- `CardHeader`: plan name + formatted price
- `CardContent`: features list with `CheckIcon`/`XIcon` (using `data-icon`)
- `Badge` "Najpopularniejszy" on highlighted plan
- Click to select → border accent highlight

- [ ] **Step 4: Verify subscription flow**

Test all three states. For onboarding, verify category picker → plan selection → Stripe redirect works.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/plan-subskrypcji/ src/components/panel/plan-subskrypcji/ && git commit -m "feat(panel): add subscription management and onboarding page"
```

---

### Task 10: Formularze page

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/formularze/page.tsx`
- Create: `src/components/panel/formularze/FormularzeTable.tsx`

- [ ] **Step 1: Build the formularze server page**

Create `src/app/(frontend)/[lang]/panel/formularze/page.tsx`:

Server component — service-provider only (redirect clients). Fetches submitted forms via `getSubmittedForms(userId)`. Renders `PanelBreadcrumb` + `FormularzeTable`.

- [ ] **Step 2: Build FormularzeTable client component**

Create `src/components/panel/formularze/FormularzeTable.tsx`:

Uses `Table` + `TableHeader` + `TableBody` + `TableRow` + `TableHead` + `TableCell`:
- Columns: sender name, email, type `Badge`, status `Badge`, offer title, date
- Click row → `Sheet` (from right) with full message + status `Select`
- `Empty` state for no forms
- `Skeleton` rows for loading
- `toast()` on status update

`Sheet` composition:
```
Sheet → SheetTrigger (the table row)
  SheetContent
    SheetHeader → SheetTitle (sender name + type)
    Message content
    Select for status update
    Button "Zapisz" with Spinner
```

- [ ] **Step 3: Verify formularze page**

Navigate to `/pl/panel/formularze`. Verify table renders, click row opens sheet, status update works.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/formularze/ src/components/panel/formularze/ && git commit -m "feat(panel): add formularze page with table and detail sheet"
```

---

### Task 11: Pomoc page

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/pomoc/page.tsx`
- Create: `src/components/panel/pomoc/PomocTable.tsx`
- Create: `src/components/panel/pomoc/NewTicketDialog.tsx`

- [ ] **Step 1: Build the pomoc server page**

Create `src/app/(frontend)/[lang]/panel/pomoc/page.tsx`:

Both roles. Fetches help tickets via `getHelpTickets(userId)`. Renders `PanelBreadcrumb`, "Nowe zgłoszenie" `Button`, `PomocTable`.

- [ ] **Step 2: Build PomocTable component**

`Table` with columns: title, status `Badge`, date. `Empty` state with `HelpCircleIcon`.

- [ ] **Step 3: Build NewTicketDialog component**

Create `src/components/panel/pomoc/NewTicketDialog.tsx`:

`Dialog` with `FieldGroup` + `Field` form:
- title `Input`
- email `Input` (pre-filled, `FieldDescription`)
- description `Textarea`
- `DialogFooter` with `Button` "Wyślij" + `Spinner`
- Calls `createHelpTicket()` on submit
- `toast()` on success, closes dialog, refreshes page

- [ ] **Step 4: Verify pomoc page**

Navigate to `/pl/panel/pomoc`. Create a test ticket, verify it appears in the list.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/pomoc/ src/components/panel/pomoc/ && git commit -m "feat(panel): add help tickets page with table and creation dialog"
```

---

### Task 12: Konto page

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/konto/page.tsx`
- Create: `src/components/panel/konto/AccountSettings.tsx`

- [ ] **Step 1: Build the konto server page**

Create `src/app/(frontend)/[lang]/panel/konto/page.tsx`:

Both roles. Fetches user data + subscription details. Renders `PanelBreadcrumb` + `AccountSettings`.

- [ ] **Step 2: Build AccountSettings client component**

Create `src/components/panel/konto/AccountSettings.tsx`:

Sections separated by `Separator`:
- Profile `Card`: `Avatar` + `AvatarImage` + `AvatarFallback` (initials), name, email (`Input disabled`), profile picture upload `Button`
- Password `Card`: `FieldGroup` + `Field` with `Input type="password"`, `Button` "Zmień hasło" with `Spinner`
- Subscription `Card` (service-providers only): plan name, category, `Badge` status, link to `/panel/plan-subskrypcji`
- Role `Badge` display
- Logout: `Button variant="destructive"` with `AlertDialog` confirmation, calls `useRootAuth().logout()`

- [ ] **Step 3: Verify konto page**

Navigate to `/pl/panel/konto`. Verify all sections render, avatar fallback works, logout dialog works.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/konto/ src/components/panel/konto/ && git commit -m "feat(panel): add account settings page with profile, password, and subscription info"
```

---

### Task 13: Ulubione page

**Files:**
- Create: `src/app/(frontend)/[lang]/panel/ulubione/page.tsx`
- Create: `src/components/panel/ulubione/FavoritesGrid.tsx`

- [ ] **Step 1: Build the ulubione server page**

Create `src/app/(frontend)/[lang]/panel/ulubione/page.tsx`:

Both roles. Fetches favorites via `getFavorites(userId)`. Renders `PanelBreadcrumb` + `FavoritesGrid`.

- [ ] **Step 2: Build FavoritesGrid client component**

Create `src/components/panel/ulubione/FavoritesGrid.tsx`:

Grid of `Card` components:
- `CardHeader` with `next/image` thumbnail
- `CardContent` with title, category `Badge`, price
- `CardFooter` with heart toggle `Button variant="ghost"` + frontend link `Button variant="outline"`
- Calls `toggleFavorite()` on heart click
- `toast()` on removal
- `Empty` state with `HeartIcon` + "Nie masz jeszcze ulubionych ofert" + link to frontend

- [ ] **Step 3: Verify ulubione page**

Navigate to `/pl/panel/ulubione`. Verify cards render, favorite toggle works, empty state shows.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/\[lang\]/panel/ulubione/ src/components/panel/ulubione/ && git commit -m "feat(panel): add favorites page with grid and toggle"
```

---

## Final Verification

### Task 14: Full panel smoke test

- [ ] **Step 1: Full navigation test**

Start dev server and test every panel route:
1. `/pl/panel/dashboard` — both roles
2. `/pl/panel/oferty` — list, detail, create, edit
3. `/pl/panel/plan-subskrypcji` — all 3 states
4. `/pl/panel/formularze` — table + sheet
5. `/pl/panel/pomoc` — table + dialog
6. `/pl/panel/konto` — all sections
7. `/pl/panel/ulubione` — grid + toggle

- [ ] **Step 2: Mobile responsiveness test**

Test all pages at mobile viewport (375px). Verify:
- Sidebar collapses to sheet
- SidebarTrigger works
- Cards stack vertically
- Tables scroll horizontally
- Wizard steps are usable

- [ ] **Step 3: Auth guard test**

1. Open panel route while logged out → should redirect to sign-in
2. Open service-provider-only page as client → should redirect to dashboard

- [ ] **Step 4: Build check**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A && git commit -m "fix(panel): address smoke test issues"
```
