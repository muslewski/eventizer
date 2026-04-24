'use client'

import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AuthOverlayProps {
  title?: string
  description?: string
  signInHref?: string
  signInLabel?: string
}

export function AuthOverlay({
  title = 'Zaloguj się, aby wysłać',
  description = 'Kontakt z usługodawcą jest dostępny dla zalogowanych użytkowników.',
  signInHref = '/auth/sign-in',
  signInLabel = 'Zaloguj się',
}: AuthOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-[inherit] bg-background/55 backdrop-blur-md">
      <div
        aria-hidden="true"
        className="inline-flex size-12 items-center justify-center rounded-[12px] border border-accent/35 bg-gradient-to-b from-accent/20 to-accent/5 text-accent"
      >
        <LockKeyhole className="size-5" />
      </div>
      <div className="max-w-xs space-y-1 px-6 text-center">
        <p className="font-bebas text-xl tracking-wide">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button size="sm" asChild>
        <Link href={signInHref}>{signInLabel}</Link>
      </Button>
    </div>
  )
}
