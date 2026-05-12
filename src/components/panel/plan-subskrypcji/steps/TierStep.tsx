'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CardPicker } from './_CardPicker'
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
      <CardPicker
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
            label: 'Multi — do 4 ofert',
            description: 'Publikuj do czterech ofert w dowolnych kategoriach.',
          },
          {
            value: 'agency',
            label: 'Agency — do 10 ofert',
            description: 'Najwyższy limit ofert — wybór agencji i większych firm.',
          },
        ]}
      />
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
