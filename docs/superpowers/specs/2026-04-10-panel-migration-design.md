# Custom Panel UI — Migration from Payload Admin

**Date:** 2026-04-10
**Status:** Approved
**Approach:** Server-First (RSC + Server Actions + Payload Local API)

---

## Overview

Migrate the service provider (and client) experience from Payload's admin panel (`/app`) to a custom shadcn-based panel (`/panel`). Payload remains the content management backend — the panel is a new UI layer that queries and mutates data via Payload's Local API through server actions.

### Goals

- Professional, responsive panel UI matching the Eventizer frontend design language
- Built entirely on **shadcn/ui components** (radix base, new-york style) — no custom markup where a shadcn component exists
- Tailwind CSS semantic tokens, Lucide icons (`data-icon` pattern), Framer Motion where beneficial
- Service providers get full offer management; clients get a lightweight experience
- No transactions or direct messaging — display and management only
- Polish language first, English support later
- Existing `/app` (Payload admin) stays untouched; auth pages continue redirecting to `/app` until the panel is accepted

### Non-Goals

- Replacing Payload admin for admins/moderators (they keep using `/app`)
- Order/transaction handling
- Direct client-to-provider communication
- English i18n (deferred)

---

## Architecture

### Route Structure

The panel lives inside `(frontend)/[lang]/panel/` to inherit the existing root layout (ThemeProvider, RootAuthProvider, Bebas Neue + Montserrat fonts, Header, Footer).

```
src/app/(frontend)/[lang]/panel/
  layout.tsx                          → Auth guard + PanelShell (sidebar + content area)
  dashboard/
    page.tsx                          → Role-aware dashboard (different widgets per role)
  oferty/
    page.tsx                          → Offer list (service-provider only)
    [slug]/
      page.tsx                        → Single offer detail/management
      edytuj/
        page.tsx                      → Edit wizard (reuses shared form)
    nowa/
      page.tsx                        → Creation wizard (reuses shared form)
  plan-subskrypcji/
    page.tsx                          → Subscription status + onboarding flow
  formularze/
    page.tsx                          → Submitted forms (service-provider only)
  pomoc/
    page.tsx                          → Help tickets (both roles)
  konto/
    page.tsx                          → Account settings (both roles)
  ulubione/
    page.tsx                          → Favorite offers (client-focused)
```

### Auth Guard

`panel/layout.tsx` is a server component that:

1. Calls `getRootAuthUser()` to check Better Auth session
2. If not authenticated → `redirect('/auth/sign-in')`
3. If authenticated → fetches full Payload user (with role, subscription data)
4. Renders `<PanelShell user={user}>` passing user data and role

Role-based page access is handled at the page level — pages like `/oferty` and `/oferty/nowa` check role server-side and redirect clients away. No separate route groups for roles.

### Layout Hierarchy

```
(frontend)/[lang]/layout.tsx          → ThemeProvider, RootAuthProvider, Header, Footer
  └─ panel/layout.tsx                 → Auth guard, PanelShell (shadcn Sidebar + SidebarInset)
      └─ dashboard/page.tsx           → Page content renders inside SidebarInset
```

The panel inherits Header and Footer from the frontend layout. The PanelShell adds a shadcn `Sidebar` component as a nested layout.

---

## Sidebar Navigation

Uses **shadcn `Sidebar`** component with full composition:

```
SidebarProvider
├── Sidebar (side="left", variant="sidebar", collapsible="icon")
│   ��── SidebarHeader
│   │   └── Role Badge (Badge variant with brand accent)
│   ├── SidebarContent
│   │   └── SidebarGroup
│   │       ├── SidebarGroupLabel → "Nawigacja"
��   │       └── SidebarGroupContent
│   │           └── SidebarMenu
│   │               └── SidebarMenuItem (per nav item)
│   │                   └── SidebarMenuButton (asChild + next/link)
│   │                       ├── LucideIcon (no sizing classes — sidebar handles it)
│   │                       └── Label text
│   └── SidebarFooter
│       └── SidebarMenu
│           └── SidebarMenuItem → Konto link
└── SidebarInset → {children} (page content)
```

- **Desktop (lg+):** `collapsible="icon"` — collapses to icon-only mode
- **Mobile (below lg):** Sidebar renders as `Sheet` automatically (built into shadcn Sidebar)
- **SidebarTrigger** in mobile panel top bar for toggle

### Service Provider Nav Items

| Label | Icon (Lucide) | Route |
|-------|---------------|-------|
| Dashboard | `LayoutDashboardIcon` | `/panel/dashboard` |
| Oferty | `FileTextIcon` | `/panel/oferty` |
| Plan subskrypcji | `CreditCardIcon` | `/panel/plan-subskrypcji` |
| Formularze | `InboxIcon` | `/panel/formularze` |
| Pomoc | `HelpCircleIcon` | `/panel/pomoc` |
| Konto | `SettingsIcon` | `/panel/konto` |

**Conditional:** If service provider has exactly 1 offer, "Oferty" label changes to "Zarządzaj ofertą" and `SidebarMenuButton` links directly to `/panel/oferty/[slug]`.

### Client Nav Items

| Label | Icon (Lucide) | Route |
|-------|---------------|-------|
| Dashboard | `LayoutDashboardIcon` | `/panel/dashboard` |
| Ulubione | `HeartIcon` | `/panel/ulubione` |
| Pomoc | `HelpCircleIcon` | `/panel/pomoc` |
| Zostań usługodawcą | `StarIcon` | `/panel/plan-subskrypcji` |
| Konto | `SettingsIcon` | `/panel/konto` |

### Sidebar Theming

Uses sidebar-specific CSS variables (defined by shadcn Sidebar):
- `--sidebar-background`, `--sidebar-foreground`
- `--sidebar-accent`, `--sidebar-accent-foreground` (for active items)
- `--sidebar-border`
- Active state via `SidebarMenuButton isActive={true}` — styled by the component, no manual classes
- `Separator` between content and footer sections

---

## Pages

### Dashboard (`/panel/dashboard`)

Single page component, renders different widgets based on role.

**Service Provider widgets** — each is a `Card` with proper composition:

```
Card
├── CardHeader
│   ├── CardTitle → metric label
│   └── CardDescription → context
├── CardContent → value display
└── CardFooter → link or action (optional)
```

- **Aktywne oferty** — `Card` with count vs `maxOffers` (e.g., "3 z 5"), `Badge` for status, `Button` quick action "Dodaj ofertę" with `<PlusIcon data-icon="inline-start" />`
- **Wyświetlenia** — placeholder `Card` for future analytics (display offer count or hide until analytics is added)
- **Nowe formularze** — `Card` with unread `submitted-forms` count, `Badge variant="secondary"` for count, link to `/panel/formularze`
- **Status subskrypcji** — `Card` with plan name, renewal date, `Badge` for status (active/expiring), link to `/panel/plan-subskrypcji`

Quick actions:
- `Button` "Dodaj nową ofertę" (with `disabled` + `Tooltip` if at limit)
- `Button` "Edytuj ofertę" shortcut (if single offer)
- Recent activity list — latest form submissions, offer status changes

Alerts/banners — using shadcn `Alert` + `AlertTitle` + `AlertDescription`:
- Subscription expiring soon → `Alert` with `AlertTriangleIcon`
- Offer limit reached → `Alert`
- Draft offers reminder → `Alert`

Empty states — using shadcn `Empty` + `EmptyHeader` + `EmptyMedia` + `EmptyTitle` + `EmptyDescription` + `EmptyContent`:
- No offers yet → `Empty` with `FileTextIcon` and "Dodaj pierwszą ofertę" `Button`
- No forms received → `Empty` with `InboxIcon`

**Client widgets:**

- **Ulubione oferty** — `Card` with count + recent favorites (3-4 compact `Card`s in grid)
- **Zgłoszenia pomocy** — `Card` with open tickets count
- "Zostań usługodawcą" — prominent CTA `Card` with `Button variant="default"` and `StarIcon data-icon="inline-start"`
- Quick links to browse categories on frontend

### Offers List (`/panel/oferty`)

Service-provider only. Redirects clients to `/panel/dashboard`.

- `Breadcrumb` → `BreadcrumbList` → `BreadcrumbItem` / `BreadcrumbLink` / `BreadcrumbSeparator` for navigation context
- Grid of offer cards using `Card` composition:
  - `CardHeader` with `next/image` (`Image`) thumbnail + `Badge` for status (Opublikowana / Robocza)
  - `CardContent` with title, category `Badge variant="outline"`, price
  - `CardFooter` with action `Button`s (edit, preview, toggle status)
- `Button` "Dodaj ofertę" at top with `<PlusIcon data-icon="inline-start" />` (disabled + `Tooltip` if at limit)
- Filter by status: `ToggleGroup type="single"` with `ToggleGroupItem` for each status (all / published / draft)
- `Empty` state when no offers exist
- `Skeleton` cards while loading
- If user has single offer → sidebar links directly to that offer's detail page

### Single Offer Detail (`/panel/oferty/[slug]`)

Read-only management view:

- `Breadcrumb` → Panel / Oferty / [Offer Title]
- Hero area: `next/image` (`Image`) for main image + title (Bebas Neue) + `Badge` for status
- Key info in `Card` grid:
  - Category `Card` with `Badge variant="outline"`
  - Price `Card` (formatted PLN)
  - Location `Card` with address, city
  - Service radius `Card` (km)
- Description preview: rendered Lexical rich text inside `Card`
- Media gallery: `next/image` grid + video preview inside `Card`
- Contact info: `Card` with phone, email, social links
- Action buttons: `Button` "Edytuj" with `<PencilIcon data-icon="inline-start" />`, `Button variant="outline"` "Podgląd na stronie", `Button variant="outline"` "Zmień status"
- Status toggle confirmation: `AlertDialog` → `AlertDialogTrigger` + `AlertDialogContent` + `AlertDialogHeader` + `AlertDialogTitle` + `AlertDialogDescription` + `AlertDialogFooter` + `AlertDialogAction` / `AlertDialogCancel`

### Offer Wizard (`/panel/oferty/nowa` and `/panel/oferty/[slug]/edytuj`)

Both routes render the same `OfferWizardForm` client component (`"use client"`). Edit mode pre-populates with existing data.

**Progress indicator:** `Progress` component at the top showing step completion (e.g., 2/5 = 40%).

**5 steps — each step uses `FieldGroup` + `Field` composition:**

1. **Podstawowe informacje**
   ```
   FieldGroup
   ├── Field
   │   ├���─ FieldLabel → "Tytu��"
   │   ├── InputGroup
   │   │   ├── InputGroupInput (with character counter)
   │   │   ���── InputGroupAddon align="inline-end" → char count
   │   └── FieldError
   ├── Field
   │   ├─�� FieldLabel → "Kategoria"
   │   ├── Custom category picker (hierarchical, 3 levels)
   │   └── FieldError
   └── Field
       ├── FieldLabel → "Krótki opis"
       ├── Textarea
       └─��� FieldError
   ```

2. **Cennik i lokalizacja**
   ```
   FieldGroup
   ├── Field
   │   ��── FieldLabel → "Przedział cenowy"
   │   └── Switch (hasPriceRange toggle)
   ├── Field (conditional based on Switch)
   │   ├── FieldLabel → "Cena" / "Cena od" + "Cena do"
   │   ├── InputGroup
   │   │   ├── InputGroupInput type="number"
   │   │   └── InputGroupAddon align="inline-end" → "PLN"
   ���   └── FieldError
   ├── Field
   │   ├── FieldLabel → "Lokalizacja"
   │   ├── Location picker (Google Places, reusing existing component)
   │   └─�� FieldError
   └���─ Field
       ├── FieldLabel → "Zasięg usługi"
       ├── Slider (1-500 km)
       ├── FieldDescription → "{value} km"
       └── FieldError
   ```

3. **Media**
   ```
   FieldGroup
   ├���─ Field
   │   ├── FieldLabel → "Zdjęcie główne" (required)
   │   ├── Image upload dropzone (next/image for preview)
   │   └── FieldError
   ├── Field
   │   ├── FieldLabel → "Galeria zdjęć"
   │   └── Multi-image upload (next/image for previews)
   ├── Field
   │   ├── FieldLabel → "Wideo"
   │   ├── Video upload
   │   └── FieldDescription → "Max 50MB"
   ├── Field (conditional, shown when video uploaded)
   │   ├── FieldLabel → "Proporcje wideo"
   │   └── ToggleGroup type="single"
   │       ├── ToggleGroupItem value="16:9" → "16:9"
   │       ├── ToggleGroupItem value="9:16" → "9:16"
   │       └── ToggleGroupItem value="1:1" → "1:1"
   └── Field
       ├── FieldLabel → "Zdjęcie tła" (optional)
       └── Image upload dropzone
   ```

4. **Opis i kontakt**
   ```
   FieldGroup
   ├── Field
   │   ├── FieldLabel → "Opis oferty"
   │   ├── Lexical rich text editor (reusing offerLexical config)
   │   └─��� FieldError
   ├── FieldSet
   │   ├── FieldLegend → "Dane kontaktowe"
   │   ├── Field → phone (InputGroup with PhoneIcon addon)
   │   └── Field → email (InputGroup with MailIcon addon)
   └── FieldSet
       ├── FieldLegend → "Media społecznościowe"
       ├── Field → facebook (InputGroup with link addon)
       ├── Field → instagram
       ├── Field → tiktok
       └── Field → linkedin
   ```

5. **Podsumowanie**
   - Read-only review of all fields using `Card` composition per section
   - Offer card preview (matching frontend `OfferListCard` style)
   - `next/image` for all image previews
   - Action buttons:
     - `Button` "Opublikuj" with `<Spinner data-icon="inline-start" />` while submitting
     - `Button variant="outline"` "Zapisz jako roboczą"

**Form architecture:**
- Single react-hook-form instance with Zod schema spanning all steps
- Each step validates its own `Field`s via `data-invalid` + `aria-invalid` pattern before allowing "Dalej"
- Validation errors shown via `FieldError` with `errors` array prop (Zod integration)
- Navigation: `Button variant="outline"` "Wstecz" / `Button` "Dalej" with `<ChevronRightIcon data-icon="inline-end" />`
- `Spinner` inside submit `Button` during server action execution (no `isPending` prop — compose with `Spinner` + `disabled`)
- Server action on final submit calls Payload Local API (`payload.create` or `payload.update`)
- All existing Payload hooks fire automatically (enforceMaxOffers, validateCategory, populateCategoryData, revalidateOffer)
- Toast feedback via `sonner` `toast()` on success/error

### Subscription & Onboarding (`/panel/plan-subskrypcji`)

Three states rendered from the same page:

**State 1 — First-time onboarding** (client wanting to become service provider):
- Step 1: **Wybierz kategorię** — hierarchical category picker using `service-categories` collection (depth 2). `Card`-based selection with `next/image` for category icons, `Badge` for subcategory count. Active selection via card border accent.
- Step 2: **Wybierz plan** — `Card` per subscription plan from `subscription-plans` collection:
  - `CardHeader` → plan name + price
  - `CardContent` → features list, each with `CheckIcon` (included) or `XIcon` (excluded) + `data-icon`
  - `Badge` "Najpopularniejszy" on highlighted plan
  - Beta option `Card` if `BETA_MODE=true`
- `Progress` bar showing step 1/2 or 2/2
- Submit → Stripe Checkout redirect. Stripe webhook (`checkout.session.completed`) handles role promotion to service-provider.
- `toast()` on success return from Stripe

**State 2 — Active subscription** (existing service provider):
- Current plan `Card`: plan name, category, renewal date, `Badge` for status
- `Button` "Zmień plan" → re-enters plan selection
- `Button variant="outline"` "Zmień kategorię" → re-enters category selection
- `Button variant="outline"` "Zarządzaj płatnościami" → Stripe Customer Portal or cancellation info

**State 3 — Subscription expired:**
- `Alert` with `AlertTriangleIcon` explaining subscription expired, offers are drafted
- `Button` "Odnów subskrypcję" → renew flow (same 2 steps as onboarding)

### Formularze (`/panel/formularze`)

Service-provider only.

- `Breadcrumb` for navigation context
- `Table` + `TableHeader` + `TableBody` + `TableRow` + `TableHead` + `TableCell` composition:
  - Columns: sender name, email, type `Badge` (zamówienie / pytanie / problem), status `Badge` (nowe / przeczytane / odpowiedziane), linked offer title, date
  - Click row → `Sheet` from right side with full message content
  - Status update via `Select` inside `Sheet` (mark as read/replied)
- `Empty` state when no forms received
- `Skeleton` rows while loading
- Sorted by newest first

### Pomoc (`/panel/pomoc`)

Both roles.

- `Breadcrumb` for navigation context
- `Table` of user's `help-tickets`:
  - Columns: title, status `Badge` (Otwarte / Rozwiązane), date
- `Button` "Nowe zgłoszenie" with `<PlusIcon data-icon="inline-start" />` → opens `Dialog`:
  - `DialogHeader` + `DialogTitle` → "Nowe zgłoszenie"
  - `FieldGroup` + `Field` composition:
    - title (`Input`)
    - email (`Input`, pre-filled, `FieldDescription` → "Adres email powiązany z kontem")
    - description (`Textarea`)
  - `DialogFooter` → `Button` "Wyślij" with `Spinner` on submit
- `Empty` state when no tickets
- `Skeleton` rows while loading
- `toast()` on successful ticket creation

### Konto (`/panel/konto`)

Both roles.

- `Breadcrumb` → Panel / Konto
- Profile section in `Card`:
  - `Avatar` + `AvatarImage` (from profile picture URL via `next/image`) + `AvatarFallback` (initials — **`AvatarFallback` is required**)
  - Name display
  - Email (read-only, `Input disabled`)
  - Profile picture upload `Button`
- Password change `Card`:
  - `FieldGroup` + `Field` composition with `Input type="password"`
  - `Button` "Zmień hasło" with `Spinner` on submit
- Subscription info `Card` (service providers only):
  - Plan name, category, status `Badge`
  - `Button variant="outline"` link to `/panel/plan-subskrypcji`
- Role display: `Badge` with role-specific variant
- `Separator` between sections
- `Button variant="destructive"` "Wyloguj się" with `AlertDialog` confirmation

### Ulubione (`/panel/ulubione`)

Client-focused (accessible to both roles).

- `Breadcrumb` → Panel / Ulubione
- Grid of favorited offers as `Card` composition:
  - `CardHeader` with `next/image` thumbnail
  - `CardContent` with title, category `Badge`, price
  - `CardFooter` with `Button variant="ghost"` toggle `HeartIcon` to remove + `Button variant="outline"` link to frontend
- `Empty` state with `HeartIcon` and "Nie masz jeszcze ulubionych ofert" + `Button` "Przeglądaj oferty"
- `Skeleton` cards while loading
- `toast()` on favorite removed

---

## Data Layer

### Server Actions (`src/actions/panel/`)

| Action | Purpose | Payload API Call |
|--------|---------|-----------------|
| `getOffers(userId)` | Fetch user's offers | `payload.find({ collection: 'offers', where: { user: { equals: userId } } })` |
| `getOffer(slug, userId)` | Single offer with ownership check | `payload.find({ collection: 'offers', where: { link: { equals: slug }, user: { equals: userId } } })` |
| `createOffer(data)` | Create new offer | `payload.create({ collection: 'offers', data })` |
| `updateOffer(id, data)` | Update existing offer | `payload.update({ collection: 'offers', id, data })` |
| `toggleOfferStatus(id)` | Publish/unpublish | `payload.update({ collection: 'offers', id, data: { _status } })` |
| `getSubmittedForms(providerId)` | Forms for this provider | `payload.find({ collection: 'submitted-forms', where: { provider: { equals: providerId } } })` |
| `updateFormStatus(id, status)` | Mark form as read/replied | `payload.update({ collection: 'submitted-forms', id, data: { status } })` |
| `getHelpTickets(userId)` | User's help tickets | `payload.find({ collection: 'help-tickets', where: { user: { equals: userId } } })` |
| `createHelpTicket(data)` | Submit new ticket | `payload.create({ collection: 'help-tickets', data })` |
| `updateAccount(data)` | Profile updates | `payload.update({ collection: 'users', id, data })` |
| `getDashboardStats(userId, role)` | Aggregated dashboard stats | Multiple Payload queries aggregated |
| `toggleFavorite(userId, offerId)` | Add/remove favorite | `payload.update({ collection: 'users', id, data: { favorites } })` |

All server actions reuse existing Payload hooks and access control — enforceMaxOffers, validateCategory, populateCategoryData, revalidateOffer all fire automatically through the Local API.

### Schema Changes

**Users collection** — add one field:

```typescript
{
  name: 'favorites',
  type: 'relationship',
  relationTo: 'offers',
  hasMany: true,
  defaultValue: [],
  access: {
    update: roleOrHigherOrSelf('client', 'id'),
  },
}
```

No other collection changes needed.

### Shared Components (`src/components/panel/`)

| Component | Purpose | Built With |
|-----------|---------|------------|
| `PanelShell` | Sidebar + SidebarInset wrapper | `SidebarProvider` + `Sidebar` + `SidebarInset` |
| `PanelNav` | Role-aware navigation items | `SidebarMenu` + `SidebarMenuItem` + `SidebarMenuButton` |
| `OfferWizardForm` | Multi-step form, shared by create and edit | `FieldGroup` + `Field` + react-hook-form + Zod |
| `WizardStep` | Individual step wrapper with validation gate | `Field` composition + step state |
| `OfferCard` | Compact offer card for list/grid views | `Card` + `CardHeader` + `CardContent` + `CardFooter` + `Badge` + `next/image` |

**Eliminated custom components** — use shadcn directly:
- ~~StatusBadge~~ → `Badge` with appropriate `variant`
- ~~StatCard~~ → `Card` with `CardHeader` / `CardContent` / `CardFooter`
- ~~StepIndicator~~ → `Progress`

### Reused Existing Components

- Category picker logic from `serviceProviderOnboarding`
- Location picker from `payload/fields/locationPicker`
- Character counter from `payload/fields/titleCharCounter`
- Lexical rich text editor config (`offerLexical`)
- Profile picture upload logic from `ProfilePictures` collection
- Password change logic from `payload/fields/changePassword`
- Subscription details fetching from `actions/stripe/getCurrentSubscriptionDetails`
- Offer categories fetching from `actions/getOfferCategories`

---

## shadcn Component Map

Comprehensive mapping of every panel UI element to specific shadcn components.

### Already Installed (27)

`Alert`, `AlertDialog`, `AspectRatio`, `Avatar`, `Badge`, `Button`, `Card`, `Carousel`, `Collapsible`, `Command`, `Dialog`, `Drawer`, `DropdownMenu`, `Form`, `Input`, `Label`, `NavigationMenu`, `Pagination`, `Popover`, `ScrollArea`, `Select`, `Separator`, `Skeleton`, `Sonner`, `Tabs`, `Textarea`, `Tooltip`

### Need to Install

| Component | Used For |
|-----------|----------|
| `Sidebar` | Panel navigation shell (includes Sheet for mobile) |
| `Field` | All form fields (`FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`) |
| `InputGroup` | Inputs with addons — currency suffix, icons, char counter (`InputGroupInput`, `InputGroupAddon`, `InputGroupText`) |
| `ToggleGroup` | Video aspect ratio selection, offer status filter |
| `Table` | Formularze list, help tickets list (`TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) |
| `Sheet` | Form detail view in formularze (slide-in from right) |
| `Progress` | Wizard step indicator |
| `Switch` | Price range toggle, other boolean fields |
| `Slider` | Service radius picker (1-500 km) |
| `Breadcrumb` | Navigation context on all subpages (`BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`) |
| `Spinner` | Loading state in buttons during server actions |
| `Empty` | Empty states for offers, forms, tickets, favorites |
| `Checkbox` | Multi-select options in forms where needed |
| `RadioGroup` | Single-select options (category selection, plan selection) |

### Component Usage by Page

| Page | shadcn Components |
|------|-------------------|
| **PanelShell** | `Sidebar`, `SidebarProvider`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarFooter`, `SidebarInset`, `SidebarTrigger`, `Separator`, `Badge` |
| **Dashboard** | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge`, `Button`, `Alert`, `AlertTitle`, `AlertDescription`, `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`, `Skeleton`, `Tooltip` |
| **Offers List** | `Card`, `Badge`, `Button`, `ToggleGroup`, `ToggleGroupItem`, `Breadcrumb`, `Empty`, `Skeleton`, `Tooltip` |
| **Offer Detail** | `Card`, `Badge`, `Button`, `Breadcrumb`, `AlertDialog`, `Separator` |
| **Offer Wizard** | `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`, `Input`, `InputGroup`, `InputGroupInput`, `InputGroupAddon`, `Textarea`, `Switch`, `Slider`, `ToggleGroup`, `ToggleGroupItem`, `Select`, `Progress`, `Button`, `Spinner`, `Card` |
| **Subscription** | `Card`, `Badge`, `Button`, `Progress`, `Alert`, `RadioGroup`, `Spinner` |
| **Formularze** | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Badge`, `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `Select`, `Button`, `Empty`, `Skeleton`, `Breadcrumb` |
| **Pomoc** | `Table`, `Badge`, `Button`, `Dialog`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `Input`, `Textarea`, `Spinner`, `Empty`, `Skeleton`, `Breadcrumb` |
| **Konto** | `Card`, `Avatar`, `AvatarImage`, `AvatarFallback`, `Input`, `Button`, `Badge`, `Separator`, `FieldGroup`, `Field`, `FieldLabel`, `Spinner`, `AlertDialog`, `Breadcrumb` |
| **Ulubione** | `Card`, `Badge`, `Button`, `Empty`, `Skeleton`, `Breadcrumb` |

---

## Styling Rules

Enforced across all panel components — from shadcn conventions:

| Rule | Do | Don't |
|------|----|-------|
| **Spacing** | `flex flex-col gap-4` | `space-y-4` |
| **Equal dimensions** | `size-10` | `w-10 h-10` |
| **Colors** | `bg-background`, `text-muted-foreground` | `bg-stone-900`, `text-gray-500` |
| **Dark mode** | Semantic tokens only | `dark:bg-*` overrides |
| **Conditional classes** | `cn("base", condition && "extra")` | Template literal ternaries |
| **Icons in buttons** | `<Icon data-icon="inline-start" />` | `<Icon className="size-4 mr-2" />` |
| **Icon sizing** | No sizing classes on icons in components | `size-4`, `w-4 h-4` on icons |
| **Status indicators** | `Badge variant="secondary"` | Custom styled `span` |
| **Dividers** | `Separator` | `<hr>`, `<div className="border-t">` |
| **Loading placeholders** | `Skeleton` | Custom `animate-pulse` divs |
| **Toasts** | `toast()` from sonner | Custom toast components |
| **Empty states** | `Empty` composition | Custom empty divs |
| **Images** | `next/image` (`Image`) | `<img>` tags |
| **Links** | `next/link` (`Link`) | `<a>` tags for internal routes |
| **Avatars** | `Avatar` + `AvatarImage` + `AvatarFallback` | `<img>` with rounded classes |
| **Card composition** | Full: `CardHeader`/`CardTitle`/`CardContent`/`CardFooter` | Everything dumped in `CardContent` |
| **Form fields** | `FieldGroup` + `Field` + `FieldLabel` | Raw `div` + `Label` |
| **Validation** | `data-invalid` on `Field`, `aria-invalid` on control | Custom error styling |
| **Confirmations** | `AlertDialog` | `window.confirm()` or custom modals |
| **Overlays z-index** | Let shadcn handle it | Manual `z-index` on Dialog/Sheet/Popover |

---

## Design System Alignment

The panel uses the same design tokens as the frontend:

- **Colors:** CSS variables (`--background`, `--foreground`, `--accent`, `--border`, `--card`, etc.) — always semantic, never raw values
- **Fonts:** Bebas Neue for headings (via `font-bebas`), Montserrat for body (via `font-montserrat`)
- **Dark mode:** Inherits from ThemeProvider (`next-themes`) — no `dark:` overrides
- **Rounded corners:** `rounded-xl` for cards, `rounded-md` for smaller elements
- **Borders:** `border-border/30` to `border-border/50` for subtle separation
- **Glass morphism:** `bg-white/10 backdrop-blur-sm` where appropriate (custom pages only, not overriding shadcn)
- **Brand accent:** Copper/gold (`rgb(210, 140, 8)`) mapped to `--accent` CSS variable
- **Shadows:** Minimal, relying on borders and subtle background differences
- **Spacing:** `gap-4 sm:gap-6 lg:gap-8` responsive scale (always `gap-*`, never `space-*`)
- **Animations:** Framer Motion for page transitions and subtle interactions where beneficial, respecting `reduce-motion` preference
