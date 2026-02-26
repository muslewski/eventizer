'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CalendarDays,
  HelpCircle,
  Wrench,
  Send,
  Loader2,
  MapPin,
  Users,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import { cn } from '@/lib/utils'
import {
  submitWebsiteContactForm,
  type WebsiteFormType,
} from '@/actions/submitWebsiteContactForm'
import type { ContactFormBlock as ContactFormBlockProps } from '@/payload-types'

// ─── Zod schema ────────────────────────────────────────────────────────────────

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
    .max(3000, 'Wiadomość nie może przekraczać 3000 znaków'),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  eventGuestCount: z.string().optional(),
})

type FormValues = z.infer<typeof baseSchema>

// ─── Type card config ──────────────────────────────────────────────────────────

interface TypeCard {
  value: WebsiteFormType
  label: string
  icon: React.ElementType
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

  const typeCards: TypeCard[] = [
    {
      value: 'organization',
      label: organizationLabel ?? 'Organizacja eventu',
      icon: CalendarDays,
    },
    { value: 'question', label: 'Zadaj pytanie', icon: HelpCircle },
    { value: 'service-problem', label: 'Problem z serwisem', icon: Wrench },
  ]

  const messagePlaceholders: Record<WebsiteFormType, string> = {
    organization: 'Opisz event, który chcesz zorganizować: rodzaj imprezy, atrakcje, styl, budżet, wszelkie dodatkowe życzenia…',
    question: 'Wpisz swoje pytanie — chętnie wyjaśnimy wszystkie wątpliwości dotyczące platformy, ofert lub procesu rejestracji…',
    'service-problem': 'Opisz problem, który napotkałeś(-aś): co się stało, kiedy, na jakim urządzeniu, jaki komunikat błędu widziałeś(-aś)…',
  }

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
      form.setError('root', { message: result.error ?? 'Wystąpił błąd. Spróbuj ponownie.' })
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
        <Card className="bg-transparent border-border/50 relative overflow-hidden">
          <CardContent className="pt-6">
          <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center gap-4 py-10 text-center"
            >
              <div className="size-16 rounded-full bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/30">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-semibold mb-2">Formularz wysłany!</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Wrócimy do Ciebie najszybciej jak to możliwe — zazwyczaj w ciągu 1–2 dni
                  roboczych. Sprawdź też swoją skrzynkę email.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => {
                  setSubmitted(false)
                  form.reset()
                }}
              >
                Wyślij kolejną wiadomość
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Type selector */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ wiadomości</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          {typeCards.map((card) => {
                            const CardIcon = card.icon
                            const isActive = field.value === card.value

                            return (
                              <button
                                key={card.value}
                                type="button"
                                onClick={() => field.onChange(card.value)}
                                className={cn(
                                  'flex flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:scale-[1.03] active:scale-[0.97]',
                                  isActive
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20'
                                    : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
                                )}
                              >
                                <CardIcon className="size-5 shrink-0" />
                                <span className="text-xs font-medium leading-tight">{card.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AnimatePresence>
                {isOrganization && (
                  <motion.div
                    key="org-hint"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground leading-relaxed">
                      {organizationDescription ??
                        'Zorganizujemy dla Ciebie niezapomniany event — powiedz nam gdzie, kiedy, ilu gości i czego potrzebujesz, a zajmiemy się resztą.'}
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {/* Name + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imię i nazwisko</FormLabel>
                        <FormControl>
                          <Input placeholder="np. Jan Kowalski" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="kontakt@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Organization extra fields */}
                <AnimatePresence>
                {isOrganization && (
                  <motion.div
                    key="org-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <FormField
                      control={form.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <CalendarClock className="size-3.5 text-primary" />
                            Termin eventu
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="np. 15 czerwca 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eventLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-primary" />
                            Lokalizacja
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="np. Warszawa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eventGuestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-primary" />
                            Liczba gości
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="np. 50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  </motion.div>
                )}
                </AnimatePresence>

                {/* Message */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wiadomość</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={messagePlaceholders[selectedType]}
                          rows={6}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                )}

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full gap-2 max-w-fit"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Wysyłanie…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Wyślij wiadomość
                    </>
                  )}
                </Button>
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
