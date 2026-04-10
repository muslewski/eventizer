'use client'

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ImagePlus, Film, Images } from 'lucide-react'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepMediaProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  watch: UseFormWatch<OfferFormData>
  setValue: UseFormSetValue<OfferFormData>
  mainImageId: number | null
  galleryIds: number[]
  videoId: number | null
  onMainImageChange: (id: number | null) => void
  onGalleryChange: (ids: number[]) => void
  onVideoChange: (id: number | null) => void
}

export function StepMedia({
  control,
  errors,
  watch,
  setValue,
}: StepMediaProps) {
  return (
    <FieldGroup>
      {/* Main image */}
      <Field>
        <FieldLabel>Zdjęcie główne</FieldLabel>
        <FieldDescription>
          Główne zdjęcie reprezentujące Twoją ofertę
        </FieldDescription>
        <div className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-muted">
          <ImagePlus className="size-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Kliknij, aby dodać zdjęcie
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Przesyłanie plików zostanie zintegrowane w następnej iteracji
            </p>
          </div>
        </div>
      </Field>

      {/* Gallery */}
      <Field>
        <FieldLabel>Galeria</FieldLabel>
        <FieldDescription>
          Dodatkowe zdjęcia do slidera/galerii oferty
        </FieldDescription>
        <div className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-muted">
          <Images className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Dodaj zdjęcia do galerii
          </p>
        </div>
      </Field>

      {/* Video */}
      <Field>
        <FieldLabel>Film promocyjny</FieldLabel>
        <FieldDescription>
          Krótki film promocyjny (maks. 50 MB, mp4 lub webm)
        </FieldDescription>
        <div className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:border-primary/50 hover:bg-muted">
          <Film className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Dodaj film promocyjny
          </p>
        </div>
      </Field>

      {/* Video aspect ratio */}
      <Field>
        <FieldLabel>Proporcje wideo</FieldLabel>
        <Controller
          name="videoAspectRatio"
          control={control}
          render={({ field }) => (
            <ToggleGroup
              type="single"
              variant="outline"
              value={field.value ?? '16:9'}
              onValueChange={(val) => {
                if (val) field.onChange(val)
              }}
            >
              <ToggleGroupItem value="16:9">Poziome (16:9)</ToggleGroupItem>
              <ToggleGroupItem value="9:16">Pionowe (9:16)</ToggleGroupItem>
              <ToggleGroupItem value="1:1">Kwadratowe (1:1)</ToggleGroupItem>
            </ToggleGroup>
          )}
        />
      </Field>
    </FieldGroup>
  )
}
