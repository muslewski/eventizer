'use client'

import type { UseFormGetValues } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface StepSummaryProps {
  getValues: UseFormGetValues<OfferFormData>
  content: any
  mainImageId: number | null
  galleryIds: number[]
  videoId: number | null
}

export function StepSummary({
  getValues,
  content,
  mainImageId,
  galleryIds,
  videoId,
}: StepSummaryProps) {
  const values = getValues()

  return (
    <div className="flex flex-col gap-4">
      {/* Basic info */}
      <Card className="bg-background border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Podstawowe informacje</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tytuł</span>
            <span className="font-medium">{values.title || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kategoria</span>
            <span className="font-medium">{values.category || '-'}</span>
          </div>
          {values.shortDescription && (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">Krótki opis</span>
              <span className="text-muted-foreground/80">{values.shortDescription}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing & Location */}
      <Card className="bg-background border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cena i lokalizacja</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cena</span>
            <span className="font-medium">
              {values.hasPriceRange
                ? `${values.priceFrom ?? '-'} - ${values.priceTo ?? '-'} PLN`
                : `${values.price ?? '-'} PLN`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Adres</span>
            <span className="font-medium">{values.address || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Zasięg</span>
            <span className="font-medium">{values.serviceRadius} km</span>
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <Card className="bg-background border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Media</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Zdjęcie główne</span>
            <Badge variant={mainImageId ? 'default' : 'secondary'}>
              {mainImageId ? 'Dodane' : 'Brak'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Galeria</span>
            <span className="font-medium">
              {galleryIds.length > 0 ? `${galleryIds.length} zdjęć` : 'Brak'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Film</span>
            <Badge variant={videoId ? 'default' : 'secondary'}>
              {videoId ? 'Dodany' : 'Brak'}
            </Badge>
          </div>
          {values.videoAspectRatio && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proporcje wideo</span>
              <span className="font-medium">{values.videoAspectRatio}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description & Content */}
      <Card className="bg-background border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Opis</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Treść</span>
            <Badge variant={content ? 'default' : 'secondary'}>
              {content ? 'Dodana' : 'Brak'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-background border-border/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {values.phone && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefon</span>
              <span className="font-medium">{values.phone}</span>
            </div>
          )}
          {values.email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{values.email}</span>
            </div>
          )}
          {values.facebook && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Facebook</span>
              <span className="truncate font-medium">{values.facebook}</span>
            </div>
          )}
          {values.instagram && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Instagram</span>
              <span className="truncate font-medium">{values.instagram}</span>
            </div>
          )}
          {values.tiktok && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">TikTok</span>
              <span className="truncate font-medium">{values.tiktok}</span>
            </div>
          )}
          {values.linkedin && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">LinkedIn</span>
              <span className="truncate font-medium">{values.linkedin}</span>
            </div>
          )}
          {!values.phone &&
            !values.email &&
            !values.facebook &&
            !values.instagram &&
            !values.tiktok &&
            !values.linkedin && (
              <p className="text-muted-foreground">Brak danych kontaktowych</p>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
