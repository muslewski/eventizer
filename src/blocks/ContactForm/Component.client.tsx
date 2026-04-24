'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarClock,
  CalendarDays,
  HelpCircle,
  Mail,
  MapPin,
  Send,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  submitWebsiteContactForm,
  type WebsiteFormType,
} from '@/actions/submitWebsiteContactForm'
import { FormTextField } from '@/components/contact-form/FormTextField'
import { FormTextareaField } from '@/components/contact-form/FormTextareaField'
import { SendButton } from '@/components/contact-form/SendButton'
import { SuccessPanel } from '@/components/contact-form/SuccessPanel'
import {
  TypeSelector,
  type TypeOption,
} from '@/components/contact-form/TypeSelector'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import type { ContactFormBlock as ContactFormBlockProps } from '@/payload-types'

// ─── Zod schema ────────────────────────────────────────────────────────────────

const MESSAGE_MAX = 3000

const baseSchema = z.object({
  type: z.enum(['organization', 'question', 'service-problem']),
  senderName: z
    .string()
    .min(2, 'Imię i nazwisko musi mieć co najmniej 2 znaki')
    .max(100, 'Za długie imię i nazwisko'),
  senderEmail: z.string().email('Podaj prawidłowy adres email'),
  message: z
    .string()
    .min(10, 'Wiadomość musi mieć co najmniej 10 znaków')
    .max(MESSAGE_MAX, `Wiadomość nie może przekraczać ${MESSAGE_MAX} znaków`),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  eventGuestCount: z.string().optional(),
})

type FormValues = z.infer<typeof baseSchema>

// ─── Per-type copy ─────────────────────────────────────────────────────────────

const MESSAGE_PLACEHOLDERS: Record<WebsiteFormType, string> = {
  organization:
    'Opisz event, który chcesz zorganizować: rodzaj imprezy, atrakcje, styl, budżet, wszelkie dodatkowe życzenia…',
  question:
    'Wpisz swoje pytanie — chętnie wyjaśnimy wszystkie wątpliwości dotyczące platformy, ofert lub procesu rejestracji…',
  'service-problem':
    'Opisz problem, który napotkałeś(-aś): co się stało, kiedy, na jakim urządzeniu, jaki komunikat błędu widziałeś(-aś)…',
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const ContactFormClient: React.FC<
  ContactFormBlockProps & { id?: string | number; className?: string }
> = ({ heading, description, organizationLabel, organizationDescription }) => {
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      type: 'organization',
      senderName: '',
      senderEmail: '',
      message: '',
      eventDate: '',
      eventLocation: '',
      eventGuestCount: '',
    },
  })

  const selectedType = form.watch('type') as WebsiteFormType
  const isOrganization = selectedType === 'organization'

  const typeOptions = useMemo<readonly TypeOption<WebsiteFormType>[]>(
    () => [
      {
        value: 'organization',
        label: organizationLabel ?? 'Organizacja eventu',
        icon: CalendarDays,
      },
      { value: 'question', label: 'Zadaj pytanie', icon: HelpCircle },
      { value: 'service-problem', label: 'Problem z serwisem', icon: Wrench },
    ],
    [organizationLabel],
  )

  const onSubmit = async (values: FormValues) => {
    const result = await submitWebsiteContactForm({
      type: values.type,
      senderName: values.senderName,
      senderEmail: values.senderEmail,
      message: values.message,
      eventDate: values.eventDate || undefined,
      eventLocation: values.eventLocation || undefined,
      eventGuestCount: values.eventGuestCount || undefined,
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
    <motion.section
      className="w-full"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <BlockHeader
        heading={heading}
        description={description ?? undefined}
        badge={{ label: 'Kontakt', variant: 'outline' }}
        lines
        icon={Send}
        aurora
      />

      <div className="mt-14 mx-auto w-full max-w-3xl">
        <Card className="relative overflow-hidden border-border/30 bg-background/40 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-20px_rgba(0,0,0,0.4)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
          />
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {submitted ? (
                <SuccessPanel
                  key="success"
                  title="Formularz wysłany!"
                  description="Wrócimy do Ciebie najszybciej jak to możliwe — zazwyczaj w ciągu 1–2 dni roboczych. Sprawdź też swoją skrzynkę email."
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
                          options={typeOptions}
                          value={selectedType}
                          onChange={(v) => form.setValue('type', v)}
                          layoutId="contact-website-type"
                        />
                      </div>

                      <AnimatePresence initial={false}>
                        {isOrganization && (
                          <motion.div
                            key="org-hint"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-xl border border-accent/20 bg-gradient-to-b from-accent/[0.06] to-accent/[0.02] p-4 text-sm leading-relaxed text-muted-foreground">
                              {organizationDescription ??
                                'Zorganizujemy dla Ciebie niezapomniany event — powiedz nam gdzie, kiedy, ilu gości i czego potrzebujesz, a zajmiemy się resztą.'}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormTextField
                          control={form.control}
                          name="senderName"
                          label="Imię i nazwisko"
                          placeholder="np. Jan Kowalski"
                          icon={UserRound}
                          autoComplete="name"
                        />
                        <FormTextField
                          control={form.control}
                          name="senderEmail"
                          label="Adres email"
                          placeholder="kontakt@example.com"
                          type="email"
                          icon={Mail}
                          autoComplete="email"
                        />
                      </div>

                      <AnimatePresence initial={false}>
                        {isOrganization && (
                          <motion.div
                            key="org-fields"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-accent/20 bg-gradient-to-b from-accent/[0.05] to-transparent p-4">
                              <FormTextField
                                control={form.control}
                                name="eventDate"
                                label="Termin eventu"
                                placeholder="np. 15 czerwca 2025"
                                icon={CalendarClock}
                              />
                              <FormTextField
                                control={form.control}
                                name="eventLocation"
                                label="Lokalizacja"
                                placeholder="np. Warszawa"
                                icon={MapPin}
                              />
                              <FormTextField
                                control={form.control}
                                name="eventGuestCount"
                                label="Liczba gości"
                                placeholder="np. 50"
                                icon={Users}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FormTextareaField
                        control={form.control}
                        name="message"
                        label="Wiadomość"
                        placeholder={MESSAGE_PLACEHOLDERS[selectedType]}
                        rows={6}
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
        </Card>
      </div>
    </motion.section>
  )
}
