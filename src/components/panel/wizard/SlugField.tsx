'use client'

import { AlertCircle, Check, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { type Control, type FieldPath, type FieldValues, useController } from 'react-hook-form'

import { checkOfferSlugAvailable } from '@/actions/panel/checkOfferSlugAvailable'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { SLUG_MAX, SLUG_MIN, SLUG_PATTERN, slugify } from '@/lib/slugify'

type AvailabilityState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'taken' }
  | { kind: 'invalid' }

interface SlugFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  /** The title field — used to derive the default slug while user hasn't
   *  manually edited the link. */
  title: string
  /** When editing an existing offer, pass its id so the live availability
   *  check excludes the user's own slug. */
  currentOfferId?: number
  /** Optional override for the URL prefix shown in the input. Defaults to
   *  the production-friendly `eventizer.pl/ogloszenia/`. */
  hostPrefix?: string
}

const DEFAULT_HOST_PREFIX = 'eventizer.pl/ogloszenia/'
const DEBOUNCE_MS = 400

export function SlugField<T extends FieldValues>({
  control,
  name,
  title,
  currentOfferId,
  hostPrefix = DEFAULT_HOST_PREFIX,
}: SlugFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })
  const value = (field.value as string | undefined) ?? ''

  // Track whether the user has manually edited the slug. Once they have,
  // title changes stop overwriting their input.
  const manuallyEditedRef = useRef<boolean>(value.length > 0)
  const lastDerivedRef = useRef<string>('')

  const [availability, setAvailability] = useState<AvailabilityState>({ kind: 'idle' })
  const [, startCheck] = useTransition()

  // Auto-derive from title until the user starts typing themselves.
  useEffect(() => {
    if (manuallyEditedRef.current) return
    const derived = slugify(title)
    if (!derived) return
    if (derived === value) return
    lastDerivedRef.current = derived
    field.onChange(derived as never)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  // Live availability check, debounced.
  useEffect(() => {
    const trimmed = value.trim()
    if (!trimmed) {
      setAvailability({ kind: 'idle' })
      return
    }
    if (!SLUG_PATTERN.test(trimmed)) {
      setAvailability({ kind: 'invalid' })
      return
    }
    setAvailability({ kind: 'checking' })
    const id = window.setTimeout(() => {
      startCheck(async () => {
        const res = await checkOfferSlugAvailable({ slug: trimmed, currentOfferId })
        setAvailability(
          res.available
            ? { kind: 'available' }
            : res.reason === 'taken'
              ? { kind: 'taken' }
              : { kind: 'invalid' },
        )
      })
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [value, currentOfferId])

  const regenerate = () => {
    const derived = slugify(title)
    if (!derived) return
    manuallyEditedRef.current = false
    lastDerivedRef.current = derived
    field.onChange(derived as never)
  }

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel className="text-sm">Link do oferty</FormLabel>
          <FormControl>
            <InputGroup
              className={cn(
                'bg-background/40 border-border/50',
                'has-[[data-slot=input-group-control]:focus-visible]:border-accent/50 has-[[data-slot=input-group-control]:focus-visible]:ring-accent/30',
              )}
            >
              <InputGroupAddon align="inline-start" className="text-muted-foreground/80">
                <span className="text-xs font-normal">{hostPrefix}</span>
              </InputGroupAddon>
              <InputGroupInput
                value={value}
                onChange={(e) => {
                  manuallyEditedRef.current = true
                  field.onChange(e.target.value as never)
                }}
                onBlur={() => {
                  // Normalize on blur so users can paste raw text and walk away.
                  const normalized = slugify(value)
                  if (normalized && normalized !== value) {
                    field.onChange(normalized as never)
                  }
                }}
                placeholder="np. fotolustro-drewniane"
                aria-invalid={
                  fieldState.error || availability.kind === 'taken' || availability.kind === 'invalid'
                    ? true
                    : undefined
                }
                inputMode="url"
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                maxLength={SLUG_MAX}
              />
              <InputGroupAddon align="inline-end">
                <AvailabilityIcon state={availability} />
              </InputGroupAddon>
            </InputGroup>
          </FormControl>

          <div className="flex items-center justify-between gap-2 text-xs">
            <p className="text-muted-foreground">
              Zostanie publicznym adresem Twojej oferty. {SLUG_MIN}–{SLUG_MAX} znaków, tylko
              małe litery, cyfry i myślniki.
            </p>
            {title && (
              <button
                type="button"
                onClick={regenerate}
                className="inline-flex shrink-0 items-center gap-1 text-accent hover:text-accent/80 transition-colors"
              >
                <RefreshCw className="size-3" />
                Wygeneruj z tytułu
              </button>
            )}
          </div>

          <AvailabilityHint state={availability} />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function AvailabilityIcon({ state }: { state: AvailabilityState }) {
  switch (state.kind) {
    case 'checking':
      return <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
    case 'available':
      return <Check className="size-4 text-emerald-500" aria-label="Dostępny" />
    case 'taken':
    case 'invalid':
      return <AlertCircle className="size-4 text-destructive" aria-label="Niedostępny" />
    case 'idle':
    default:
      return <span className="block size-4" aria-hidden />
  }
}

function AvailabilityHint({ state }: { state: AvailabilityState }) {
  if (state.kind === 'taken') {
    return (
      <p className="text-xs text-destructive">
        Ten link jest już zajęty — wybierz inny.
      </p>
    )
  }
  if (state.kind === 'invalid') {
    return (
      <p className="text-xs text-destructive">
        Nieprawidłowy format. Tylko małe litery, cyfry i myślniki (np. fotolustro-drewniane).
      </p>
    )
  }
  return null
}
