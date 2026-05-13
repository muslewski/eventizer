'use client'

import {
  BoxesIcon,
  Building2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LightbulbIcon,
  RocketIcon,
} from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { RichCardPicker } from './_RichCardPicker'
import { WizardRoiHint } from './_WizardRoiHint'
import type { WizardFormData } from '../lib/planChangeSchema'

export function TierStep({
  onBack,
  onNext,
}: {
  onBack: () => void
  onNext: () => void
}) {
  const form = useFormContext<WizardFormData>()
  const value = form.watch('selectedTierSlug')
  const headingId = 'tier-heading'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="font-bebas text-2xl tracking-wide">
          Wybierz pakiet
        </h2>
        <p className="text-sm text-muted-foreground">
          Każdy pakiet różni się limitem ofert i zakresem kategorii.
        </p>
      </div>

      <RichCardPicker
        ariaLabelledBy={headingId}
        value={value}
        onChange={(v) => {
          form.setValue('selectedTierSlug', v)
          form.resetField('selectedPriceId')
          form.resetField('selectedIntervalKey')
        }}
        options={[
          {
            value: 'multi',
            icon: BoxesIcon,
            supertitle: 'Do 4 usług',
            title: 'Plan Multi',
            tagline: 'Dla firm oferujących kilka różnych usług',
            popular: true,
            bullets: [
              'Do 4 różnych usług (np. DJ + fotobudka + dekoracje)',
              'Każda usługa w osobnej kategorii',
              'Jedno konto – pełniejsza oferta',
              'Lepsza prezentacja Twojej działalności',
              'Brak prowizji',
            ],
            footer: {
              icon: LightbulbIcon,
              text: 'Rozwijaj swoją ofertę i docieraj do różnych klientów.',
            },
          },
          {
            value: 'agency',
            icon: Building2Icon,
            supertitle: 'Do 10 usług',
            title: 'Plan Agency',
            tagline: 'Dla firm z szeroką ofertą usług',
            bullets: [
              'Do 10 różnych usług',
              'Obecność w wielu kategoriach',
              'Kompleksowa oferta w jednym miejscu',
              'Idealne dla agencji i większych firm',
              'Brak prowizji',
            ],
            footer: {
              icon: RocketIcon,
              text: 'Zbuduj pełną ofertę swojej firmy w Eventizer.',
            },
          },
        ]}
      />

      <WizardRoiHint>Jedno zlecenie może pokryć koszt subskrypcji.</WizardRoiHint>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeftIcon data-icon="inline-start" /> Wstecz
        </Button>
        <Button disabled={!value} onClick={onNext}>
          Dalej <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
