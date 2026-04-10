'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepPricingProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  watch: UseFormWatch<OfferFormData>
  setValue: UseFormSetValue<OfferFormData>
}

export function StepPricing({ control, errors, watch, setValue }: StepPricingProps) {
  const hasPriceRange = watch('hasPriceRange')
  const serviceRadius = watch('serviceRadius')

  return (
    <FieldGroup>
      {/* Price range toggle */}
      <Field orientation="horizontal">
        <FieldLabel htmlFor="hasPriceRange">Zakres cenowy</FieldLabel>
        <Controller
          name="hasPriceRange"
          control={control}
          render={({ field }) => (
            <Switch
              id="hasPriceRange"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </Field>

      {/* Price fields */}
      {!hasPriceRange ? (
        <Field data-invalid={!!errors.price}>
          <FieldLabel htmlFor="price">Cena</FieldLabel>
          <InputGroup>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <InputGroupInput
                  id="price"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                  aria-invalid={!!errors.price}
                />
              )}
            />
            <InputGroupAddon align="inline-end">PLN</InputGroupAddon>
          </InputGroup>
          <FieldError>{errors.price?.message}</FieldError>
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.priceFrom}>
            <FieldLabel htmlFor="priceFrom">Cena od</FieldLabel>
            <InputGroup>
              <Controller
                name="priceFrom"
                control={control}
                render={({ field }) => (
                  <InputGroupInput
                    id="priceFrom"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                    aria-invalid={!!errors.priceFrom}
                  />
                )}
              />
              <InputGroupAddon align="inline-end">PLN</InputGroupAddon>
            </InputGroup>
            <FieldError>{errors.priceFrom?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.priceTo}>
            <FieldLabel htmlFor="priceTo">Cena do</FieldLabel>
            <InputGroup>
              <Controller
                name="priceTo"
                control={control}
                render={({ field }) => (
                  <InputGroupInput
                    id="priceTo"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : undefined)
                    }
                    aria-invalid={!!errors.priceTo}
                  />
                )}
              />
              <InputGroupAddon align="inline-end">PLN</InputGroupAddon>
            </InputGroup>
            <FieldError>{errors.priceTo?.message}</FieldError>
          </Field>
        </div>
      )}

      {/* Address */}
      <Field data-invalid={!!errors.address}>
        <FieldLabel htmlFor="address">Adres</FieldLabel>
        <FieldDescription>
          Wpisz adres lub miasto, z którego świadczysz usługi
        </FieldDescription>
        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <Input
              id="address"
              placeholder="np. Warszawa, ul. Marszałkowska 1"
              {...field}
              aria-invalid={!!errors.address}
            />
          )}
        />
        <FieldError>{errors.address?.message}</FieldError>
      </Field>

      {/* Service radius */}
      <Field>
        <FieldLabel>Zasięg usługi</FieldLabel>
        <FieldDescription>
          Jak daleko od swojej lokalizacji jesteś w stanie świadczyć usługi?
        </FieldDescription>
        <Controller
          name="serviceRadius"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-3">
              <Slider
                min={1}
                max={500}
                step={5}
                value={[field.value]}
                onValueChange={(vals) => field.onChange(vals[0])}
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>1 km</span>
                <span className="font-medium text-foreground">
                  {serviceRadius} km
                </span>
                <span>500 km</span>
              </div>
            </div>
          )}
        />
      </Field>
    </FieldGroup>
  )
}
