'use client'

import type { Offer } from '@/payload-types'
import { useRootAuth } from '@/providers/RootAuthProvider'
import { OfferContactForm } from './index'

interface OfferContactFormSectionProps {
  offer: Offer
}

export const OfferContactFormSection: React.FC<OfferContactFormSectionProps> = ({ offer }) => {
  const { user } = useRootAuth()
  const isAuthenticated = !!user

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 sm:space-y-8">
      {/* Decorative accent divider */}
      <div className="flex items-center justify-center gap-3" aria-hidden="true">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
        <div className="h-1.5 w-3 rounded-full bg-primary/25" />
        <div className="h-1.5 w-8 rounded-full bg-primary/40" />
        <div className="h-1.5 w-3 rounded-full bg-primary/25" />
        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
      </div>

      <OfferContactForm
        offer={offer}
        isAuthenticated={isAuthenticated}
        userEmail={user?.email}
        userName={user?.name}
      />
    </section>
  )
}
