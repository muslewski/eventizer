'use client'

import { ChevronRightIcon, LayersIcon, TargetIcon, XIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { RichCardPicker } from './_RichCardPicker'
import { WizardRoiHint } from './_WizardRoiHint'
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

      <RichCardPicker
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
            icon: TargetIcon,
            title: 'Jedna oferta',
            tagline: 'Skup się na jednej usłudze',
            bullets: [
              'Jedna główna usługa (np. DJ, fotograf, sala)',
              'Widoczność w odpowiedniej kategorii',
              'Prosty start bez zbędnych opcji',
              'Idealne dla specjalistów jednej usługi',
            ],
          },
          {
            value: 'multi',
            icon: LayersIcon,
            title: 'Wiele usług',
            tagline: 'Dla firm oferujących różne usługi',
            bullets: [
              'Dodaj różne usługi na jednym koncie',
              'Każda usługa w swojej kategorii',
              'Buduj kompleksową ofertę',
              'Idealne dla rozwijających się firm',
            ],
          },
        ]}
      />

      <WizardRoiHint>
        Już jedna realizacja może zwrócić koszt korzystania z Eventizer.
      </WizardRoiHint>

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
