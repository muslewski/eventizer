'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form'
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
import { Phone, Mail, Globe } from 'lucide-react'
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin } from 'react-icons/fa6'
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

        <Field data-invalid={!!errors.website}>
          <FieldLabel htmlFor="website">Strona internetowa</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Globe className="size-4" />
            </InputGroupAddon>
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <InputGroupInput
                  id="website"
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  {...field}
                />
              )}
            />
          </InputGroup>
          <FieldError>{errors.website?.message}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="facebook">Facebook</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <FaFacebook className="size-4" />
            </InputGroupAddon>
            <Controller
              name="facebook"
              control={control}
              render={({ field }) => (
                <InputGroupInput
                  id="facebook"
                  placeholder="https://facebook.com/..."
                  {...field}
                />
              )}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="instagram">Instagram</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <FaInstagram className="size-4" />
            </InputGroupAddon>
            <Controller
              name="instagram"
              control={control}
              render={({ field }) => (
                <InputGroupInput
                  id="instagram"
                  placeholder="https://instagram.com/..."
                  {...field}
                />
              )}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="tiktok">TikTok</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <FaTiktok className="size-4" />
            </InputGroupAddon>
            <Controller
              name="tiktok"
              control={control}
              render={({ field }) => (
                <InputGroupInput
                  id="tiktok"
                  placeholder="https://tiktok.com/@..."
                  {...field}
                />
              )}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="linkedin">LinkedIn</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <FaLinkedin className="size-4" />
            </InputGroupAddon>
            <Controller
              name="linkedin"
              control={control}
              render={({ field }) => (
                <InputGroupInput
                  id="linkedin"
                  placeholder="https://linkedin.com/in/..."
                  {...field}
                />
              )}
            />
          </InputGroup>
        </Field>
      </FieldSet>
    </FieldGroup>
  )
}
