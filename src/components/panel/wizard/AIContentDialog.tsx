'use client'

import { useState, useCallback } from 'react'
import { useCompletion } from '@ai-sdk/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { SparklesIcon, HistoryIcon } from 'lucide-react'
import {
  useAiGenerationHistory,
  formatCooldown,
} from '@/components/panel/wizard/useAiGenerationHistory'

interface AIContentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  category: string
  onGenerated: (markdown: string) => void
}

export function AIContentDialog({
  open,
  onOpenChange,
  title,
  category,
  onGenerated,
}: AIContentDialogProps) {
  const [uniqueFeatures, setUniqueFeatures] = useState('')
  const [services, setServices] = useState('')
  const [experience, setExperience] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')

  const { complete, isLoading, completion } = useCompletion({
    api: '/api/generate-content',
    streamProtocol: 'text',
  })

  const {
    history,
    canGenerate,
    remaining,
    resetInMs,
    add: addHistoryEntry,
    maxGenerations,
  } = useAiGenerationHistory('ai-gen:rich-content')

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return
    const result = await complete('', {
      body: {
        title,
        category,
        uniqueFeatures,
        services,
        experience,
        additionalInfo,
      },
    })

    if (result) {
      addHistoryEntry(result)
      onGenerated(result)
      onOpenChange(false)
    }
  }, [canGenerate, complete, title, category, uniqueFeatures, services, experience, additionalInfo, addHistoryEntry, onGenerated, onOpenChange])

  const handleApplyPrevious = useCallback(
    (text: string) => {
      onGenerated(text)
      onOpenChange(false)
    },
    [onGenerated, onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-accent" />
            Generuj treść z AI
          </DialogTitle>
          <DialogDescription>
            Podaj informacje o swojej ofercie, a AI wygeneruje profesjonalny opis
            z odpowiednim formatowaniem.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Co wyróżnia Twoją ofertę?</FieldLabel>
            <FieldDescription>
              Unikalne cechy, specjalizacja, to co odróżnia Cię od konkurencji
            </FieldDescription>
            <Textarea
              value={uniqueFeatures}
              onChange={(e) => setUniqueFeatures(e.target.value)}
              placeholder="np. 10 lat doświadczenia, indywidualne podejście, nowoczesny sprzęt..."
              rows={2}
            />
          </Field>

          <Field>
            <FieldLabel>Zakres usług</FieldLabel>
            <FieldDescription>
              Jakie konkretne usługi oferujesz w ramach tej oferty?
            </FieldDescription>
            <Textarea
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="np. oprawa muzyczna wesela, obsługa imprez firmowych, DJ na urodziny..."
              rows={2}
            />
          </Field>

          <Field>
            <FieldLabel>Doświadczenie i portfolio</FieldLabel>
            <FieldDescription>
              Ile masz doświadczenia, jakie wydarzenia obsługiwałeś?
            </FieldDescription>
            <Textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="np. ponad 200 wesel, współpraca z top hotelami, festiwale muzyczne..."
              rows={2}
            />
          </Field>

          <Field>
            <FieldLabel>Dodatkowe informacje</FieldLabel>
            <FieldDescription>
              Cokolwiek innego co chciałbyś zawrzeć w opisie
            </FieldDescription>
            <Textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="np. elastyczne podejście do budżetu, dojazd w cenie, pakiety premium..."
              rows={2}
            />
          </Field>
        </FieldGroup>

        {/* Streaming preview */}
        {isLoading && completion && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 max-h-40 overflow-y-auto">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {completion.slice(0, 200)}...
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-accent/60 animate-pulse rounded-sm" />
            </p>
          </div>
        )}

        {/* Previous generations */}
        {history.length > 0 && !isLoading && (
          <div className="flex flex-col gap-2 rounded-lg border border-border/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <HistoryIcon className="size-3.5" />
              Poprzednie generacje ({history.length}/{maxGenerations})
            </div>
            <div className="flex flex-col gap-1.5">
              {history.map((entry, i) => (
                <button
                  key={entry.ts}
                  type="button"
                  onClick={() => handleApplyPrevious(entry.text)}
                  className="flex items-start gap-2 rounded-md border border-border/30 bg-background p-2 text-left text-xs transition-colors hover:border-accent/40 hover:bg-accent/5"
                >
                  <span className="shrink-0 font-medium text-accent">#{i + 1}</span>
                  <span className="line-clamp-2 text-muted-foreground">
                    {entry.text.replace(/[#*_`>-]/g, '').slice(0, 160)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!canGenerate && (
          <p className="text-xs text-muted-foreground">
            Osiągnięto dzienny limit generacji ({maxGenerations}). Dostępne{' '}
            {resetInMs !== null ? formatCooldown(resetInMs) : 'wkrótce'} — możesz zastosować jedną z
            poprzednich generacji powyżej.
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Anuluj
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={isLoading || !canGenerate}>
            {isLoading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            {isLoading
              ? 'Generowanie...'
              : canGenerate
                ? `Generuj treść (${remaining}/${maxGenerations})`
                : 'Limit osiągnięty'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
