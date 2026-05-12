'use client'

import { ChevronRightIcon, XIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CardPicker } from './_CardPicker'
import type { WizardFormData } from '../lib/planChangeSchema'

export function PlanKindStep({
  onNext,
  onCancel,
}: {
  onNext: () => void
  onCancel?: () => void
}) {
  const form = useFormContext<WizardFormData>()
  const value = form.watch('selectedKind')
  const headingId = 'plan-kind-heading'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="font-bebas text-2xl tracking-wide">
          Wybierz typ planu
        </h2>
        <p className="text-sm text-muted-foreground">
          Zdecyduj, czy oferujesz jedną usługę, czy chcesz publikować ich więcej.
        </p>
      </div>
      <CardPicker
        ariaLabelledBy={headingId}
        value={value}
        onChange={(v) => {
          form.setValue('selectedKind', v)
          // Reset downstream fields when kind changes
          form.resetField('selectedCategoryPath')
          form.resetField('selectedTierSlug')
          form.resetField('selectedPriceId')
          form.resetField('selectedIntervalKey')
        }}
        options={[
          {
            value: 'single',
            label: 'Pojedyncza oferta',
            description:
              'Idealne, jeśli świadczysz jeden rodzaj usługi i prowadzisz jedną wizytówkę.',
          },
          {
            value: 'multi',
            label: 'Wiele ofert',
            description:
              'Publikuj kilka ofert pod jednym kontem — przydatne dla agencji i wielobranżowych firm.',
          },
        ]}
      />
      <div className="flex justify-between">
        {onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            <XIcon data-icon="inline-start" /> Anuluj
          </Button>
        ) : (
          <div />
        )}
        <Button disabled={!value} onClick={onNext}>
          Dalej <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
