'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldDescription,
} from '@/components/ui/field'
import { createHelpTicket } from '@/actions/panel/help'

const ticketSchema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany'),
  email: z.string(),
  description: z.string().min(1, 'Opis jest wymagany'),
})

type TicketFormData = z.infer<typeof ticketSchema>

interface NewTicketDialogProps {
  userEmail: string
}

export function NewTicketDialog({ userEmail }: NewTicketDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      email: userEmail,
      description: '',
    },
  })

  function onSubmit(data: TicketFormData) {
    startTransition(async () => {
      const result = await createHelpTicket(data)
      if (result.success) {
        toast.success('Zgłoszenie zostało wysłane')
        reset({ title: '', email: userEmail, description: '' })
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Nie udało się wysłać zgłoszenia')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Nowe zgłoszenie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowe zgłoszenie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ticket-title">Tytuł</FieldLabel>
              <Input
                id="ticket-title"
                placeholder="Krótki opis problemu"
                {...register('title')}
              />
              <FieldError errors={errors.title ? [{ message: errors.title.message }] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="ticket-email">Email</FieldLabel>
              <Input
                id="ticket-email"
                type="email"
                {...register('email')}
              />
              <FieldDescription>Adres email powiązany z kontem</FieldDescription>
              <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
            </Field>

            <Field>
              <FieldLabel htmlFor="ticket-description">Opis</FieldLabel>
              <Textarea
                id="ticket-description"
                placeholder="Opisz szczegółowo swój problem..."
                rows={5}
                {...register('description')}
              />
              <FieldError errors={errors.description ? [{ message: errors.description.message }] : []} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              Wyślij
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
