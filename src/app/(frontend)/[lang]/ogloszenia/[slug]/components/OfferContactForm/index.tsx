'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  Mail,
  MessageCircleQuestion,
  Send,
  ShoppingCart,
  UserRound,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { submitOfferForm, type FormType } from '@/actions/submitOfferForm'
import { AuthOverlay } from '@/components/contact-form/AuthOverlay'
import { FormTextField } from '@/components/contact-form/FormTextField'
import { FormTextareaField } from '@/components/contact-form/FormTextareaField'
import { SendButton } from '@/components/contact-form/SendButton'
import { SuccessPanel } from '@/components/contact-form/SuccessPanel'
import {
  TypeSelector,
  type TypeOption,
} from '@/components/contact-form/TypeSelector'
import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import type { Offer } from '@/payload-types'

// ─── Zod schema ────────────────────────────────────────────────────────────────

const MESSAGE_MAX = 2000

const formSchema = z.object({
  type: z.enum(['order', 'question', 'problem']),
  senderName: z
    .string()
    .min(2, 'Imię i nazwisko musi mieć co najmniej 2 znaki')
    .max(100, 'Za długie imię i nazwisko'),
  senderEmail: z.string().email('Podaj prawidłowy adres email'),
  message: z
    .string()
    .min(10, 'Wiadomość musi mieć co najmniej 10 znaków')
    .max(MESSAGE_MAX, `Wiadomość nie może przekraczać ${MESSAGE_MAX} znaków`),
})

type FormValues = z.infer<typeof formSchema>

// ─── Per-type copy ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: readonly TypeOption<FormType>[] = [
  { value: 'order', label: 'Złóż zamówienie', icon: ShoppingCart },
  { value: 'question', label: 'Zadaj pytanie', icon: MessageCircleQuestion },
  { value: 'problem', label: 'Zgłoś problem', icon: AlertTriangle },
]

const MESSAGE_PLACEHOLDERS: Record<FormType, string> = {
  order:
    'Opisz szczegółowo swoje zamówienie: termin, liczba gości, lokalizacja eventu, dodatkowe wymagania…',
  question:
    'Wpisz swoje pytanie dotyczące oferty, cen, dostępności lub zakresu usług…',
  problem:
    'Opisz problem, który napotkałeś(-aś): co się stało, kiedy, jakich usług dotyczył…',
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface OfferContactFormProps {
  offer: Offer
  isAuthenticated: boolean
  userEmail?: string | null
  userName?: string | null
}

export const OfferContactForm: React.FC<OfferContactFormProps> = ({
  offer,
  isAuthenticated,
  userEmail,
  userName,
}) => {
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'question',
      senderName: userName ?? '',
      senderEmail: userEmail ?? '',
      message: '',
    },
  })

  const selectedType = form.watch('type') as FormType

  const onSubmit = async (values: FormValues) => {
    const result = await submitOfferForm({
      offerId: offer.id,
      type: values.type,
      senderName: values.senderName,
      senderEmail: values.senderEmail,
      message: values.message,
    })

    if (result.success) {
      setSubmitted(true)
    } else {
      form.setError('root', {
        message: result.error ?? 'Wystąpił błąd. Spróbuj ponownie.',
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden border-border/30 bg-background/40 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-20px_rgba(0,0,0,0.4)]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        />

        <CardHeader className="flex flex-row items-center gap-4 border-b border-border/40 pb-5">
          <span
            aria-hidden="true"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-accent/35 bg-gradient-to-b from-accent/20 to-accent/5 text-accent"
          >
            <Send className="size-5" />
          </span>
          <CardTitle className="flex flex-col gap-0.5 text-base font-montserrat font-normal">
            <SpanLikeH3 title="Skontaktuj się z usługodawcą" />
            <span className="text-xs text-muted-foreground">
              Odpowiedź zwykle w ciągu 24 godzin
            </span>
          </CardTitle>
        </CardHeader>

        <div className="relative">
          <CardContent
            className={cn(
              'p-6 sm:p-8',
              !isAuthenticated && 'pointer-events-none select-none blur-sm',
            )}
            aria-hidden={!isAuthenticated}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <SuccessPanel
                  key="success"
                  title="Wiadomość wysłana!"
                  description="Usługodawca wkrótce się z Tobą skontaktuje. Sprawdź swoją skrzynkę email — wysłaliśmy Ci potwierdzenie."
                  onReset={() => {
                    setSubmitted(false)
                    form.reset()
                  }}
                />
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Typ wiadomości</p>
                        <TypeSelector
                          options={TYPE_OPTIONS}
                          value={selectedType}
                          onChange={(v) => form.setValue('type', v)}
                          layoutId="contact-offer-type"
                        />
                      </div>

                      <FormTextField
                        control={form.control}
                        name="senderName"
                        label="Twoje imię i nazwisko"
                        placeholder="np. Jan Kowalski"
                        icon={UserRound}
                        autoComplete="name"
                      />

                      <FormTextField
                        control={form.control}
                        name="senderEmail"
                        label="Twój adres email"
                        placeholder="kontakt@example.com"
                        type="email"
                        icon={Mail}
                        autoComplete="email"
                      />

                      <FormTextareaField
                        control={form.control}
                        name="message"
                        label="Wiadomość"
                        placeholder={MESSAGE_PLACEHOLDERS[selectedType]}
                        rows={5}
                        maxLength={MESSAGE_MAX}
                        showCounter
                      />

                      {form.formState.errors.root && (
                        <p
                          role="alert"
                          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                        >
                          {form.formState.errors.root.message}
                        </p>
                      )}

                      <div className="pt-1">
                        <SendButton isSubmitting={form.formState.isSubmitting} />
                      </div>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {!isAuthenticated && <AuthOverlay />}
        </div>
      </Card>
    </motion.div>
  )
}
