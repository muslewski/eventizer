'use client'

import { Controller, type Control, type FieldErrors, type UseFormWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { EventTypePicker, type EventTypeItem } from '@/components/panel/wizard/EventTypePicker'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepBasicInfoProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  watch: UseFormWatch<OfferFormData>
  categories: any[]
  eventTypes: EventTypeItem[]
}

export function StepBasicInfo({ control, errors, categories, eventTypes }: StepBasicInfoProps) {
  return (
    <FieldGroup>
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="title">Tytuł oferty</FieldLabel>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Input
                id="title"
                placeholder="np. DJ na wesele - profesjonalna oprawa muzyczna"
                {...field}
                aria-invalid={!!errors.title}
              />
              <div className="flex items-center justify-between">
                <FieldError>{errors.title?.message}</FieldError>
                <span className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/150
                </span>
              </div>
            </div>
          )}
        />
      </Field>

      <Field data-invalid={!!errors.category}>
        <FieldLabel>Kategoria</FieldLabel>
        <FieldDescription>
          Wybierz kategorię, która najlepiej opisuje Twoją ofertę
        </FieldDescription>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <CategoryPicker
              categories={categories}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FieldError>{errors.category?.message}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Rodzaje eventów</FieldLabel>
        <FieldDescription>
          Wybierz rodzaje eventów, na których świadczysz tę usługę. Pozostawienie wszystkich zaznaczonych = oferta pojawi się we wszystkich filtrach.
        </FieldDescription>
        <Controller
          name="eventTypes"
          control={control}
          render={({ field }) => (
            <EventTypePicker
              eventTypes={eventTypes}
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </Field>
    </FieldGroup>
  )
}
