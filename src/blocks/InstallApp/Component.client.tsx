'use client'

import React, { useState, useEffect } from 'react'
import { motion, type Variants, type Transition } from 'motion/react'
import { cn } from '@/lib/utils'
import { useStandalone } from '@/hooks/useStandalone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
        <DialogDescription className="sr-only">{title}</DialogDescription>
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
    <section id="install-app" className={cn('w-full', className)}>
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
                  <Button variant={iosIsPrimary ? 'default' : 'outline'} size="lg">
                    <AppleIcon />
                    {iosButtonLabel}
                  </Button>
                }
              />
              <InstructionDialog
                title={androidDialogTitle}
                steps={androidSteps}
                doneMessage={doneMessage}
                trigger={
                  <Button variant={iosIsPrimary ? 'outline' : 'default'} size="lg">
                    <AndroidIcon />
                    {androidButtonLabel}
                  </Button>
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
    const base = window.location.origin + window.location.pathname
    setUrl(`${base}#install-app`)
  }, [])

  return (
    <section id="install-app" className={cn('w-full max-w-5xl mx-auto px-4', className)}>
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
            className="flex shrink-0 items-center justify-center rounded-xl bg-white p-4 shadow-sm border border-border/20"
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
  blockHeader: React.ReactNode
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
  blockHeader,
  className,
}) => {
  const [platform, setPlatform] = useState<Platform>('desktop')
  const isStandalone = useStandalone()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (isIOS) {
      setPlatform('ios')
    } else if (/Android/.test(ua)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    setIsReady(true)
  }, [])

  useEffect(() => {
    if (isReady && window.location.hash === '#install-app') {
      const timeout = setTimeout(() => {
        document.getElementById('install-app')?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [isReady])

  if (!isReady || isStandalone) return <div id="install-app" />

  if (platform === 'desktop') {
    return (
      <div className="flex flex-col items-center gap-8 w-full">
        {blockHeader}
        <DesktopView
          qrLabel={qrLabel}
          qrHeading={qrHeading}
          qrDescription={qrDescription}
          className={className}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {blockHeader}
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
    </div>
  )
}
