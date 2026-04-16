'use client'

import { useCallback, useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field'
import { SparklesIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OfferFormData } from '@/components/panel/wizard/offerSchema'

interface ShortDescriptionGeneratorProps {
  control: Control<OfferFormData>
  errors: FieldErrors<OfferFormData>
  title: string
  category: string
  price: string
  address: string
  content: any
  onGenerated: (text: string) => void
}

export function ShortDescriptionGenerator({
  control,
  errors,
  title,
  category,
  price,
  address,
  content,
  onGenerated,
}: ShortDescriptionGeneratorProps) {
  const [wasGenerated, setWasGenerated] = useState(false)

  const { complete, isLoading, completion } = useCompletion({
    api: '/api/generate-description',
    streamProtocol: 'text',
  })

  const handleGenerate = useCallback(async () => {
    const result = await complete('', {
      body: {
        title,
        category,
        price,
        address,
        content,
      },
    })

    if (result) {
      onGenerated(result)
      setWasGenerated(true)
    }
  }, [complete, title, category, price, address, content, onGenerated])

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.shortDescription}>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="shortDescription">Krótki opis oferty</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isLoading || !title}
            className="gap-1.5"
          >
            {isLoading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            {wasGenerated ? 'Generuj ponownie' : 'Generuj z AI'}
          </Button>
        </div>
        <FieldDescription>
          Podsumowanie widoczne na listach wyników i w kartach ofert.
        </FieldDescription>

        {/* AI shimmer during generation */}
        {isLoading && completion && (
          <div className="relative rounded-lg border border-accent/30 bg-accent/5 p-3">
            <p className="text-sm leading-relaxed">
              {completion}
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-accent/60 animate-pulse rounded-sm" />
            </p>
          </div>
        )}

        {/* Generated notice */}
        {wasGenerated && !isLoading && (
          <Alert className="border-accent/20 bg-accent/5 py-2">
            <SparklesIcon className="size-3.5 text-accent" />
            <AlertDescription className="text-xs">
              Wygenerowaliśmy krótki opis z AI — możesz go swobodnie dostosować.
            </AlertDescription>
          </Alert>
        )}

        <Controller
          name="shortDescription"
          control={control}
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Textarea
                id="shortDescription"
                placeholder="Opisz krótko swoją ofertę — co wyróżnia Cię na tle konkurencji?"
                rows={3}
                {...field}
                className={cn(isLoading && 'opacity-50')}
                aria-invalid={!!errors.shortDescription}
              />
              <div className="flex items-center justify-between">
                <FieldError>{errors.shortDescription?.message}</FieldError>
                <div className="flex items-center gap-2">
                  {wasGenerated && (
                    <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                      <SparklesIcon className="size-2.5" />
                      AI
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/500
                  </span>
                </div>
              </div>
            </div>
          )}
        />
      </Field>
    </FieldGroup>
  )
}
