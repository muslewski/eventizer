# Install App Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CMS-managed Payload block that prompts mobile visitors to install Eventizer via "Add to Home Screen", and shows a QR code on desktop.

**Architecture:** New Payload block (`installApp`) with localized fields, a thin server component pass-through, and a client component handling platform detection, phone mockup card (mobile), QR code card (desktop), and instruction dialogs. Block hides when app is already in standalone mode.

**Tech Stack:** Payload CMS 3.x block system, React 19, `motion/react`, shadcn `Dialog`, `qrcode.react`, Tailwind CSS

---

### Task 1: Install qrcode.react dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

Run: `pnpm add qrcode.react`

- [ ] **Step 2: Verify installation**

Run: `pnpm ls qrcode.react`
Expected: Shows `qrcode.react` with a version number

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add qrcode.react dependency for install app block"
```

---

### Task 2: Create Payload block config

**Files:**
- Create: `src/blocks/InstallApp/config.ts`

- [ ] **Step 1: Create the block config file**

```typescript
import type { Block } from 'payload'

export const InstallApp: Block = {
  slug: 'installApp',
  interfaceName: 'InstallAppBlock',
  labels: {
    singular: {
      en: 'Install App',
      pl: 'Zainstaluj aplikację',
    },
    plural: {
      en: 'Install App Blocks',
      pl: 'Bloki instalacji aplikacji',
    },
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      defaultValue: 'Aplikacja mobilna',
      required: true,
      label: {
        en: 'Section Label',
        pl: 'Etykieta sekcji',
      },
      admin: {
        description: {
          en: 'Small uppercase label displayed above the heading (mobile view)',
          pl: 'Mała etykieta wyświetlana nad nagłówkiem (widok mobilny)',
        },
      },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      defaultValue: 'Twoje wydarzenia, jedno dotknięcie',
      required: true,
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Zainstaluj Eventizer na telefonie, by mieć natychmiastowy dostęp. Bez app store.',
      required: true,
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'iosButtonLabel',
      type: 'text',
      localized: true,
      defaultValue: 'iPhone',
      required: true,
      label: {
        en: 'iOS Button Label',
        pl: 'Tekst przycisku iOS',
      },
    },
    {
      name: 'androidButtonLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Android',
      required: true,
      label: {
        en: 'Android Button Label',
        pl: 'Tekst przycisku Android',
      },
    },
    {
      name: 'qrLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Aplikacja mobilna',
      required: true,
      label: {
        en: 'QR Section Label',
        pl: 'Etykieta sekcji QR',
      },
      admin: {
        description: {
          en: 'Small uppercase label displayed above the heading (desktop view)',
          pl: 'Mała etykieta wyświetlana nad nagłówkiem (widok desktopowy)',
        },
      },
    },
    {
      name: 'qrHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Pobierz aplikację na telefon',
      required: true,
      label: {
        en: 'QR Heading',
        pl: 'Nagłówek QR',
      },
    },
    {
      name: 'qrDescription',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Zeskanuj kod QR aparatem telefonu, aby zainstalować Eventizer.',
      required: true,
      label: {
        en: 'QR Description',
        pl: 'Opis QR',
      },
    },
    {
      name: 'iosDialogTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Zainstaluj na iPhonie',
      required: true,
      label: {
        en: 'iOS Dialog Title',
        pl: 'Tytuł okna iOS',
      },
    },
    {
      name: 'iosSteps',
      type: 'array',
      localized: true,
      required: true,
      minRows: 1,
      maxRows: 10,
      label: {
        en: 'iOS Installation Steps',
        pl: 'Kroki instalacji iOS',
      },
      admin: {
        description: {
          en: 'Step-by-step instructions for adding to home screen on iOS Safari',
          pl: 'Instrukcje krok po kroku dla dodania do ekranu głównego na iOS Safari',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: {
            en: 'Step Text',
            pl: 'Tekst kroku',
          },
        },
      ],
      defaultValue: [
        { text: 'Kliknij przycisk Udostępnij (\u2B06) na dole Safari' },
        { text: 'Przewiń w dół i kliknij "Dodaj do ekranu głównego"' },
        { text: 'Kliknij "Dodaj" w prawym górnym rogu' },
      ],
    },
    {
      name: 'androidDialogTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Zainstaluj na Androidzie',
      required: true,
      label: {
        en: 'Android Dialog Title',
        pl: 'Tytuł okna Android',
      },
    },
    {
      name: 'androidSteps',
      type: 'array',
      localized: true,
      required: true,
      minRows: 1,
      maxRows: 10,
      label: {
        en: 'Android Installation Steps',
        pl: 'Kroki instalacji Android',
      },
      admin: {
        description: {
          en: 'Step-by-step instructions for adding to home screen on Android',
          pl: 'Instrukcje krok po kroku dla dodania do ekranu głównego na Android',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: {
            en: 'Step Text',
            pl: 'Tekst kroku',
          },
        },
      ],
      defaultValue: [
        { text: 'Kliknij przycisk menu (\u22EE) w prawym górnym rogu przeglądarki' },
        { text: 'Kliknij "Dodaj do ekranu głównego" lub "Zainstaluj aplikację"' },
        { text: 'Kliknij "Dodaj", aby potwierdzić' },
      ],
    },
    {
      name: 'doneMessage',
      type: 'text',
      localized: true,
      defaultValue: 'To wszystko! Eventizer pojawi się na ekranie głównym.',
      required: true,
      label: {
        en: 'Done Message',
        pl: 'Wiadomość końcowa',
      },
      admin: {
        description: {
          en: 'Confirmation text shown below the steps in the dialog',
          pl: 'Tekst potwierdzenia wyświetlany pod krokami w oknie dialogowym',
        },
      },
    },
  ],
}
```

- [ ] **Step 2: Verify file was created**

Run: `ls src/blocks/InstallApp/config.ts`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add src/blocks/InstallApp/config.ts
git commit -m "feat: add InstallApp Payload block config with localized fields"
```

---

### Task 3: Create server component

**Files:**
- Create: `src/blocks/InstallApp/Component.tsx`

- [ ] **Step 1: Create the server component**

```typescript
import type { InstallAppBlock as InstallAppBlockProps } from '@/payload-types'
import React from 'react'
import { InstallAppClient } from './Component.client'

export const InstallAppBlock: React.FC<
  InstallAppBlockProps & {
    id?: string | number
    className?: string
  }
> = (props) => {
  return <InstallAppClient {...props} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/blocks/InstallApp/Component.tsx
git commit -m "feat: add InstallApp server component wrapper"
```

---

### Task 4: Register block in RenderBlocks and Pages collection

**Files:**
- Modify: `src/blocks/RenderBlocks.tsx`
- Modify: `src/collections/Pages/index.ts`

- [ ] **Step 1: Add import and entry to RenderBlocks.tsx**

Add this import after the existing `MissionBlock` import:

```typescript
import { InstallAppBlock } from '@/blocks/InstallApp/Component'
```

Add this entry to the `blockComponents` object after `mission: MissionBlock,`:

```typescript
  installApp: InstallAppBlock,
```

- [ ] **Step 2: Add import and entry to Pages/index.ts**

Add this import after the existing `Mission` import:

```typescript
import { InstallApp } from '@/blocks/InstallApp/config'
```

Add `InstallApp` to the `blocks` array in the layout field, after `Mission`:

```typescript
                Mission,
                InstallApp,
```

- [ ] **Step 3: Commit**

```bash
git add src/blocks/RenderBlocks.tsx src/collections/Pages/index.ts
git commit -m "feat: register InstallApp block in RenderBlocks and Pages collection"
```

---

### Task 5: Generate Payload types

**Files:**
- Modify: `src/payload-types.ts` (auto-generated)

- [ ] **Step 1: Run type generation**

Run: `pnpm generate:types`
Expected: Completes without errors. The `InstallAppBlock` interface should now exist in `src/payload-types.ts`.

- [ ] **Step 2: Verify the type was generated**

Run: `grep 'InstallAppBlock' src/payload-types.ts | head -5`
Expected: Shows the `InstallAppBlock` interface definition

- [ ] **Step 3: Run import map generation**

Run: `pnpm generate:importmap`
Expected: Completes without errors.

- [ ] **Step 4: Commit**

```bash
git add src/payload-types.ts src/app/\(payload\)/importMap.js
git commit -m "chore: regenerate Payload types and importmap for InstallApp block"
```

---

### Task 6: Create client component — platform detection shell

**Files:**
- Create: `src/blocks/InstallApp/Component.client.tsx`

- [ ] **Step 1: Create the client component with platform detection and rendering shells**

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { motion, type Variants, type Transition } from 'motion/react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'
import type { InstallAppBlock } from '@/payload-types'

type Platform = 'ios' | 'android' | 'desktop'

// --- Animation variants ---

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1,
      delayChildren: 0.1,
    } as Transition,
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  },
}

// --- Phone Mockup ---

const PhoneMockup: React.FC = () => (
  <div className="w-[160px] h-[280px] sm:w-[180px] sm:h-[320px] bg-card/80 rounded-[24px] border-2 border-border/60 p-3 flex flex-col shrink-0 shadow-2xl shadow-black/20">
    {/* Notch */}
    <div className="w-10 h-1 bg-border/40 rounded-full mx-auto mb-3" />
    {/* Screen */}
    <div className="flex-1 bg-gradient-to-b from-primary/10 to-primary/5 rounded-xl flex flex-col items-center justify-center gap-2 p-3">
      {/* App icon */}
      <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center text-background font-bold text-lg">
        E
      </div>
      <span className="text-[10px] font-semibold text-foreground/80">Eventizer</span>
      {/* Skeleton lines */}
      <div className="w-full space-y-2 mt-3">
        <div className="h-1.5 w-4/5 mx-auto rounded-full bg-foreground/5" />
        <div className="h-1.5 w-3/5 mx-auto rounded-full bg-foreground/5" />
        <div className="h-1.5 w-2/3 mx-auto rounded-full bg-foreground/5" />
      </div>
    </div>
    {/* Home indicator */}
    <div className="w-8 h-1 bg-border/40 rounded-full mx-auto mt-3" />
  </div>
)

// --- Instruction Dialog ---

interface InstructionDialogProps {
  title: string
  steps: { text: string; id?: string | null }[]
  doneMessage: string
  trigger: React.ReactNode
}

const InstructionDialog: React.FC<InstructionDialogProps> = ({
  title,
  steps,
  doneMessage,
  trigger,
}) => (
  <Dialog>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <ol className="space-y-4 py-2">
        {steps.map((step, index) => (
          <li key={step.id ?? index} className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {index + 1}
            </span>
            <span className="text-sm text-foreground/90 leading-relaxed pt-0.5">
              {step.text}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground border-t border-border/40 pt-4">
        {doneMessage}
      </p>
    </DialogContent>
  </Dialog>
)

// --- Platform Button ---

interface PlatformButtonProps {
  icon: React.ReactNode
  label: string
  variant: 'primary' | 'secondary'
}

const PlatformButton: React.FC<PlatformButtonProps> = ({ icon, label, variant }) => (
  <button
    className={cn(
      'flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors cursor-pointer',
      variant === 'primary'
        ? 'bg-foreground text-background hover:bg-foreground/90'
        : 'bg-foreground/10 text-foreground border border-border/40 hover:bg-foreground/15',
    )}
  >
    {icon}
    {label}
  </button>
)

// --- Apple & Android Icons ---

const AppleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn('h-4 w-4', className)}>
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
)

const AndroidIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn('h-4 w-4', className)}>
    <path d="M17.523 15.341a.91.91 0 0 0 .913-.907c0-.502-.41-.908-.913-.908a.91.91 0 0 0-.912.908c0 .5.41.907.912.907m-11.046 0a.91.91 0 0 0 .913-.907.91.91 0 0 0-.913-.908.91.91 0 0 0-.912.908c0 .5.41.907.912.907m11.4-6.485 2.006-3.459a.418.418 0 0 0-.153-.572.42.42 0 0 0-.574.152l-2.033 3.506A12.2 12.2 0 0 0 12 7.296c-1.783 0-3.46.44-4.923 1.187L5.044 4.977a.42.42 0 0 0-.575-.152.418.418 0 0 0-.152.572l2.006 3.46C2.92 10.876.5 14.291.5 18.242h23C23.5 14.29 21.08 10.875 17.877 8.856" />
  </svg>
)

// --- Mobile View ---

interface MobileViewProps {
  label: string
  heading: string
  description: string
  iosButtonLabel: string
  androidButtonLabel: string
  iosDialogTitle: string
  iosSteps: { text: string; id?: string | null }[]
  androidDialogTitle: string
  androidSteps: { text: string; id?: string | null }[]
  doneMessage: string
  platform: Platform
  className?: string
}

const MobileView: React.FC<MobileViewProps> = ({
  label,
  heading,
  description,
  iosButtonLabel,
  androidButtonLabel,
  iosDialogTitle,
  iosSteps,
  androidDialogTitle,
  androidSteps,
  doneMessage,
  platform,
  className,
}) => {
  const iosIsPrimary = platform === 'ios'

  return (
    <section className={cn('w-full', className)}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-card to-primary/5 border border-border/40 p-8 sm:p-12"
      >
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
          {/* Phone mockup */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <PhoneMockup />
          </motion.div>

          {/* Content */}
          <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3"
            >
              {label}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-bebas text-3xl sm:text-4xl md:text-5xl tracking-wide leading-[0.95] mb-4"
            >
              {heading}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mb-8"
            >
              {description}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <InstructionDialog
                title={iosDialogTitle}
                steps={iosSteps}
                doneMessage={doneMessage}
                trigger={
                  <PlatformButton
                    icon={<AppleIcon />}
                    label={iosButtonLabel}
                    variant={iosIsPrimary ? 'primary' : 'secondary'}
                  />
                }
              />
              <InstructionDialog
                title={androidDialogTitle}
                steps={androidSteps}
                doneMessage={doneMessage}
                trigger={
                  <PlatformButton
                    icon={<AndroidIcon />}
                    label={androidButtonLabel}
                    variant={iosIsPrimary ? 'secondary' : 'primary'}
                  />
                }
              />
            </motion.div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" aria-hidden />
      </motion.div>
    </section>
  )
}

// --- Desktop View ---

interface DesktopViewProps {
  qrLabel: string
  qrHeading: string
  qrDescription: string
  className?: string
}

const DesktopView: React.FC<DesktopViewProps> = ({
  qrLabel,
  qrHeading,
  qrDescription,
  className,
}) => {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  return (
    <section className={cn('w-full', className)}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-card to-primary/5 border border-border/40 p-8 sm:p-12"
      >
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
          {/* QR Code */}
          <motion.div
            variants={fadeUp}
            className="flex shrink-0 items-center justify-center rounded-xl bg-white p-4"
          >
            {url && (
              <QRCodeSVG
                value={url}
                size={160}
                bgColor="transparent"
                fgColor="#000000"
                level="M"
              />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3"
            >
              {qrLabel}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-bebas text-3xl sm:text-4xl md:text-5xl tracking-wide leading-[0.95] mb-4"
            >
              {qrHeading}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md"
            >
              {qrDescription}
            </motion.p>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" aria-hidden />
      </motion.div>
    </section>
  )
}

// --- Main Component ---

interface InstallAppClientProps extends InstallAppBlock {
  className?: string
}

export const InstallAppClient: React.FC<InstallAppClientProps> = ({
  label,
  heading,
  description,
  iosButtonLabel,
  androidButtonLabel,
  qrLabel,
  qrHeading,
  qrDescription,
  iosDialogTitle,
  iosSteps,
  androidDialogTitle,
  androidSteps,
  doneMessage,
  className,
}) => {
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [isStandalone, setIsStandalone] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    if (standalone) {
      setIsStandalone(true)
      setIsReady(true)
      return
    }

    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios')
    } else if (/Android/.test(ua)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    setIsReady(true)
  }, [])

  if (!isReady || isStandalone) return null

  if (platform === 'desktop') {
    return (
      <DesktopView
        qrLabel={qrLabel}
        qrHeading={qrHeading}
        qrDescription={qrDescription}
        className={className}
      />
    )
  }

  return (
    <MobileView
      label={label}
      heading={heading}
      description={description}
      iosButtonLabel={iosButtonLabel}
      androidButtonLabel={androidButtonLabel}
      iosDialogTitle={iosDialogTitle}
      iosSteps={iosSteps ?? []}
      androidDialogTitle={androidDialogTitle}
      androidSteps={androidSteps ?? []}
      doneMessage={doneMessage}
      platform={platform}
      className={className}
    />
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `pnpm tsc --noEmit 2>&1 | head -20`
Expected: No errors related to InstallApp files. (Some pre-existing warnings may appear — ignore those.)

- [ ] **Step 3: Commit**

```bash
git add src/blocks/InstallApp/Component.client.tsx
git commit -m "feat: add InstallApp client component with platform detection, mobile/desktop views, and instruction dialogs"
```

---

### Task 7: Verify full build and manually test

**Files:** None (verification only)

- [ ] **Step 1: Run the dev server**

Run: `pnpm dev`
Expected: Starts without build errors.

- [ ] **Step 2: Test in Payload admin**

Open the Payload admin panel, edit a page, and add the "Install App" block to the layout. Verify:
- All fields appear with correct Polish labels and defaults
- The `iosSteps` and `androidSteps` arrays are pre-populated with 3 steps each
- Localization toggle works (switch to EN locale, fields are empty/editable separately)

- [ ] **Step 3: Test on the frontend**

View the page with the block added. On desktop, verify:
- QR code card renders with correct heading and description
- QR code encodes the current page URL

On mobile (use browser DevTools device emulation or a real phone), verify:
- Phone mockup card renders with correct heading, description, and platform buttons
- Current platform button has primary styling
- Clicking "iPhone" button opens dialog with iOS steps
- Clicking "Android" button opens dialog with Android steps
- Done message appears at the bottom of each dialog

- [ ] **Step 4: Test standalone detection**

In DevTools Application tab, check "Override display mode" → "standalone". Reload the page. Verify:
- The Install App block is completely hidden

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete InstallApp block — CMS config, platform detection, mobile/desktop views, instruction dialogs"
```
