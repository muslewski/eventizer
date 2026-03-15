'use client'

import type { Offer } from '@/payload-types'
import { useRootAuth } from '@/providers/RootAuthProvider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface MobileContactActionsProps {
  offer: Offer
}

export function MobileContactActions({ offer }: MobileContactActionsProps) {
  const { user } = useRootAuth()
  const isAuthenticated = Boolean(user)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  const hasPhone = Boolean(offer.phone)
  const hasEmail = Boolean(offer.email)

  return (
    <>
      <div className="fixed inset-x-4 bottom-4 z-40 md:hidden pb-[max(env(safe-area-inset-bottom),0.25rem)]">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-background/95 backdrop-blur p-2 shadow-sm">
          {isAuthenticated ? (
            hasPhone ? (
              <Button variant="outline" size="lg" className="w-full" asChild>
                <a href={`tel:${offer.phone}`}>
                  <Phone className="size-4" />
                  Zadzwoń
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="lg" className="w-full" disabled>
                <Phone className="size-4" />
                Zadzwoń
              </Button>
            )
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setAuthDialogOpen(true)}
            >
              <Phone className="size-4" />
              Zadzwoń
            </Button>
          )}

          {isAuthenticated ? (
            hasEmail ? (
              <Button size="lg" className="w-full" asChild>
                <a href={`mailto:${offer.email}`}>
                  <Mail className="size-4" />
                  Napisz
                </a>
              </Button>
            ) : (
              <Button size="lg" className="w-full" disabled>
                <Mail className="size-4" />
                Napisz
              </Button>
            )
          ) : (
            <Button size="lg" className="w-full" onClick={() => setAuthDialogOpen(true)}>
              <Mail className="size-4" />
              Napisz
            </Button>
          )}
        </div>
      </div>

      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="max-w-sm p-5">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base sm:text-lg">Wymagane logowanie</DialogTitle>
            <DialogDescription className="leading-relaxed">
              Aby wykonać tę akcję, musisz być zalogowany.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="w-full" onClick={() => setAuthDialogOpen(false)}>
              Zamknij
            </Button>
            <Button className="w-full" asChild>
              <Link href="/auth/sign-in">Zaloguj się</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
