'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group'
import { Phone, Mail } from 'lucide-react'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepDescriptionProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  watch: UseFormWatch<OfferFormData>
  setValue: UseFormSetValue<OfferFormData>
}

export function StepDescription({
  control,
  errors,
}: StepDescriptionProps) {
  return (
    <FieldGroup>
      {/* Contact info */}
      <Field data-invalid={!!errors.phone}>
        <FieldLabel htmlFor="phone">Telefon</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Phone className="size-4" />
          </InputGroupAddon>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <InputGroupInput
                id="phone"
                type="tel"
                placeholder="np. +48 123 456 789"
                {...field}
              />
            )}
          />
        </InputGroup>
        <FieldError>{errors.phone?.message}</FieldError>
      </Field>

      <Field data-invalid={!!errors.email}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Mail className="size-4" />
          </InputGroupAddon>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputGroupInput
                id="email"
                type="email"
                placeholder="np. kontakt@firma.pl"
                {...field}
              />
            )}
          />
        </InputGroup>
        <FieldError>{errors.email?.message}</FieldError>
      </Field>

      {/* Social media */}
      <FieldSet>
        <FieldLegend>Media społecznościowe</FieldLegend>

        <Field>
          <FieldLabel htmlFor="facebook">Facebook</FieldLabel>
          <Controller
            name="facebook"
            control={control}
            render={({ field }) => (
              <Input
                id="facebook"
                placeholder="https://facebook.com/..."
                {...field}
              />
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="instagram">Instagram</FieldLabel>
          <Controller
            name="instagram"
            control={control}
            render={({ field }) => (
              <Input
                id="instagram"
                placeholder="https://instagram.com/..."
                {...field}
              />
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="tiktok">TikTok</FieldLabel>
          <Controller
            name="tiktok"
            control={control}
            render={({ field }) => (
              <Input
                id="tiktok"
                placeholder="https://tiktok.com/@..."
                {...field}
              />
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="linkedin">LinkedIn</FieldLabel>
          <Controller
            name="linkedin"
            control={control}
            render={({ field }) => (
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/..."
                {...field}
              />
            )}
          />
        </Field>
      </FieldSet>
    </FieldGroup>
  )
}
