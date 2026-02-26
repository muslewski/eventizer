'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShoppingCart, MessageCircleQuestion, AlertTriangle, LockKeyhole, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'
import { submitOfferForm, type FormType } from '@/actions/submitOfferForm'
import type { Offer } from '@/payload-types'

// ─── Zod schema ────────────────────────────────────────────────────────────────

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
    .max(2000, 'Wiadomość nie może przekraczać 2000 znaków'),
})

type FormValues = z.infer<typeof formSchema>

// ─── Config per type ───────────────────────────────────────────────────────────

const typeConfig = {
  order: {
    label: 'Złóż zamówienie',
    icon: ShoppingCart,
    messagePlaceholder:
      'Opisz szczegółowo swoje zamówienie: termin, liczba gości, lokalizacja eventu, dodatkowe wymagania…',
    nameLabel: 'Twoje imię i nazwisko',
    namePlaceholder: 'np. Jan Kowalski',
  },
  question: {
    label: 'Zadaj pytanie',
    icon: MessageCircleQuestion,
    messagePlaceholder:
      'Wpisz swoje pytanie dotyczące oferty, cen, dostępności lub zakresu usług…',
    nameLabel: 'Twoje imię i nazwisko',
    namePlaceholder: 'np. Anna Nowak',
  },
  problem: {
    label: 'Zgłoś problem',
    icon: AlertTriangle,
    messagePlaceholder:
      'Opisz problem, który napotkałeś(-aś): co się stało, kiedy, jakich usług dotyczył…',
    nameLabel: 'Twoje imię i nazwisko',
    namePlaceholder: 'np. Marek Wiśniewski',
  },
} satisfies Record<FormType, object>

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
  const config = typeConfig[selectedType]
  const Icon = config.icon

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
      form.setError('root', { message: result.error ?? 'Wystąpił błąd. Spróbuj ponownie.' })
    }
  }

  return (
    <Card className="bg-transparent border-border/50 relative overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center font-normal gap-4 sm:gap-6 text-xl font-montserrat">
          <Icon className="size-6 sm:size-8 text-primary" />
          <SpanLikeH3 title="Skontaktuj się z usługodawcą" />
        </CardTitle>
      </CardHeader>

      <div className="relative">
        <CardContent className={`pt-6 ${!isAuthenticated ? 'select-none blur-sm pointer-events-none' : ''}`} aria-hidden={!isAuthenticated}>
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="size-6 text-primary" />
              </div>
              <p className="text-lg font-medium">Wiadomość wysłana!</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Usługodawca wkrótce się z Tobą skontaktuje. Sprawdź swoją skrzynkę email — wysłaliśmy Ci potwierdzenie.
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => { setSubmitted(false); form.reset() }}>
                Wyślij kolejną wiadomość
              </Button>
            </div>
          ) : (
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
                          {(Object.entries(typeConfig) as [FormType, (typeof typeConfig)[FormType]][]).map(
                            ([value, cfg]) => {
                              const TabIcon = cfg.icon
                              const isActive = field.value === value
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => field.onChange(value)}
                                  className={cn(
                                    'flex flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    isActive
                                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                      : 'border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground',
                                  )}
                                >
                                  <TabIcon className="size-5 shrink-0" />
                                  <span className="text-xs font-medium leading-tight">
                                    {cfg.label}
                                  </span>
                                </button>
                              )
                            },
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Name */}
                <FormField
                  control={form.control}
                  name="senderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{config.nameLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={config.namePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twój adres email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="kontakt@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Message */}
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wiadomość</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={config.messagePlaceholder}
                          rows={5}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Root error */}
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
          )}
        </CardContent>

        {/* Auth overlay */}
        {!isAuthenticated && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/30 z-10">
            <LockKeyhole className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium text-center px-4">
              Zaloguj się, aby skontaktować się z usługodawcą
            </p>
            <Button size="sm" asChild>
              <Link href="/auth/sign-in">Zaloguj się</Link>
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
