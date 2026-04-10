'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { InboxIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { updateFormStatus } from '@/actions/panel/forms'
import type { SubmittedForm } from '@/payload-types'

interface FormularzeTableProps {
  forms: SubmittedForm[]
}

type FormStatus = 'new' | 'read' | 'replied'
type FormType = 'order' | 'question' | 'problem'

function typeBadge(type: FormType) {
  const labels: Record<FormType, string> = {
    order: 'Zamówienie',
    question: 'Pytanie',
    problem: 'Problem',
  }
  const variants: Record<FormType, 'default' | 'secondary' | 'destructive'> = {
    order: 'default',
    question: 'secondary',
    problem: 'destructive',
  }
  return <Badge variant={variants[type]}>{labels[type]}</Badge>
}

function statusBadge(status: FormStatus) {
  const labels: Record<FormStatus, string> = {
    new: 'Nowe',
    read: 'Przeczytane',
    replied: 'Odpowiedziane',
  }
  const variants: Record<FormStatus, 'default' | 'secondary' | 'outline'> = {
    new: 'default',
    read: 'secondary',
    replied: 'outline',
  }
  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

export function FormularzeTable({ forms }: FormularzeTableProps) {
  const router = useRouter()
  const [selectedForm, setSelectedForm] = useState<SubmittedForm | null>(null)
  const [newStatus, setNewStatus] = useState<FormStatus>('new')
  const [isPending, startTransition] = useTransition()

  function openForm(form: SubmittedForm) {
    setSelectedForm(form)
    setNewStatus(form.status as FormStatus)
  }

  function handleSave() {
    if (!selectedForm) return
    startTransition(async () => {
      const result = await updateFormStatus(selectedForm.id, newStatus)
      if (result.success) {
        toast.success('Status formularza został zaktualizowany')
        setSelectedForm(null)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Nie udało się zaktualizować statusu')
      }
    })
  }

  const offerTitle = (form: SubmittedForm) => {
    if (typeof form.offer === 'object' && form.offer !== null) {
      return form.offer.title
    }
    return form.offerTitle
  }

  if (forms.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>Nie otrzymałeś jeszcze żadnych formularzy</EmptyTitle>
          <EmptyDescription>
            Gdy klienci wyślą Ci formularze kontaktowe, pojawią się tutaj.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nadawca</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => (
              <TableRow
                key={form.id}
                className="cursor-pointer"
                onClick={() => openForm(form)}
              >
                <TableCell className="font-medium">{form.senderName}</TableCell>
                <TableCell className="text-muted-foreground">{form.senderEmail}</TableCell>
                <TableCell>{typeBadge(form.type as FormType)}</TableCell>
                <TableCell>{statusBadge(form.status as FormStatus)}</TableCell>
                <TableCell className="text-muted-foreground">{offerTitle(form)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(form.createdAt).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedForm} onOpenChange={(open) => !open && setSelectedForm(null)}>
        <SheetContent className="flex flex-col gap-6 overflow-y-auto">
          {selectedForm && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selectedForm.senderName} — {selectedForm.type === 'order' ? 'Zamówienie' : selectedForm.type === 'question' ? 'Pytanie' : 'Problem'}
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{selectedForm.senderEmail}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Oferta</p>
                  <p className="text-sm text-muted-foreground">{offerTitle(selectedForm)}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Wiadomość</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedForm.message}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Status</p>
                  <Select value={newStatus} onValueChange={(val) => setNewStatus(val as FormStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nowe</SelectItem>
                      <SelectItem value="read">Przeczytane</SelectItem>
                      <SelectItem value="replied">Odpowiedziane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSave} disabled={isPending}>
                  {isPending && <Spinner data-icon="inline-start" />}
                  Zapisz
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
