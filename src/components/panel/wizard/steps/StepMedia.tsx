'use client'

import { Controller, type Control, type FieldErrors, type UseFormWatch } from 'react-hook-form'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SingleImageUpload, GalleryUpload, VideoUpload } from '@/components/panel/wizard/FileUpload'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface UploadedFile {
  id: number
  url: string
  filename: string
}

interface StepMediaProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  watch: UseFormWatch<OfferFormData>
  mainImage: UploadedFile | null
  galleryImages: UploadedFile[]
  video: UploadedFile | null
  backgroundImage: UploadedFile | null
  onMainImageChange: (file: UploadedFile | null) => void
  onGalleryChange: (files: UploadedFile[]) => void
  onVideoChange: (file: UploadedFile | null) => void
  onBackgroundImageChange: (file: UploadedFile | null) => void
}

export function StepMedia({
  control,
  errors,
  mainImage,
  galleryImages,
  video,
  backgroundImage,
  onMainImageChange,
  onGalleryChange,
  onVideoChange,
  onBackgroundImageChange,
}: StepMediaProps) {
  return (
    <FieldGroup>
      {/* Main image */}
      <Field>
        <FieldLabel>Zdjęcie główne <span className="text-destructive">*</span></FieldLabel>
        <FieldDescription>Główne zdjęcie reprezentujące Twoją ofertę</FieldDescription>
        <SingleImageUpload
          value={mainImage}
          onChange={onMainImageChange}
          label="Kliknij lub przeciągnij zdjęcie główne"
          required
        />
      </Field>

      {/* Gallery */}
      <Field>
        <FieldLabel>Galeria zdjęć</FieldLabel>
        <FieldDescription>
          Dodatkowe zdjęcia — użyj strzałek aby zmienić kolejność
        </FieldDescription>
        <GalleryUpload value={galleryImages} onChange={onGalleryChange} />
      </Field>

      {/* Video */}
      <Field>
        <FieldLabel>Film promocyjny</FieldLabel>
        <FieldDescription>Krótki film promocyjny (max 50MB)</FieldDescription>
        <VideoUpload value={video} onChange={onVideoChange} />
      </Field>

      {/* Video aspect ratio — only when video is uploaded */}
      {video && (
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
      )}

      {/* Background image */}
      <Field>
        <FieldLabel>Zdjęcie tła (opcjonalne)</FieldLabel>
        <FieldDescription>Alternatywne tło dla strony oferty</FieldDescription>
        <SingleImageUpload value={backgroundImage} onChange={onBackgroundImageChange} />
      </Field>
    </FieldGroup>
  )
}
