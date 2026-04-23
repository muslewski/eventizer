'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Trash2Icon } from 'lucide-react'
import { deleteOffer } from '@/actions/panel/offers'

interface DeleteOfferButtonProps {
  offerId: number
  offerTitle: string
  lang: string
}

export function DeleteOfferButton({ offerId, offerTitle, lang }: DeleteOfferButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteOffer(offerId)
      if (result.success) {
        toast.success('Oferta została usunięta')
        router.push(`/${lang}/panel/oferty`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isPending} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          {isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Trash2Icon data-icon="inline-start" />
          )}
          Usuń ofertę
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć ofertę?</AlertDialogTitle>
          <AlertDialogDescription>
            Oferta <span className="font-medium text-foreground">„{offerTitle}”</span> zostanie
            trwale usunięta. Tej operacji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
