'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangleIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { dismissDowngradeDraftedBanner } from '@/actions/panel/dismissDowngradeDraftedBanner'

export function DowngradeDraftedBanner({ lang }: { lang: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function handleDismiss() {
    startTransition(async () => {
      const result = await dismissDowngradeDraftedBanner()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <Alert>
      <AlertTriangleIcon />
      <div className="flex flex-col gap-2 w-full">
        <AlertTitle>Twoja subskrypcja została obniżona</AlertTitle>
        <AlertDescription>
          Część Twoich ofert została automatycznie zapisana jako wersje robocze, aby zmieścić się
          w limicie nowego planu. Możesz je przejrzeć w sekcji „Oferty” i wybrać, które chcesz
          opublikować ponownie.
        </AlertDescription>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/${lang}/panel/oferty`}>Przejdź do ofert</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={isPending}>
            <XIcon data-icon="inline-start" />
            Zamknij
          </Button>
        </div>
      </div>
    </Alert>
  )
}
