'use client'

import { useTransition } from 'react'
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
import { toggleOfferStatus } from '@/actions/panel/offers'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OfferStatusToggleProps {
  offerId: number
  currentStatus: string
}

export function OfferStatusToggle({ offerId, currentStatus }: OfferStatusToggleProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isPublished = currentStatus === 'published'

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleOfferStatus(offerId, currentStatus)
      if (result.success) {
        toast.success(isPublished ? 'Oferta wycofana z publikacji' : 'Oferta opublikowana')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isPublished ? 'Wycofaj z publikacji' : 'Opublikuj'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isPublished ? 'Wycofać ofertę?' : 'Opublikować ofertę?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isPublished
              ? 'Oferta nie będzie widoczna dla klientów.'
              : 'Oferta będzie widoczna publicznie.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle}>
            {isPublished ? 'Wycofaj' : 'Opublikuj'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
