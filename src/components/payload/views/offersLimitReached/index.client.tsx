'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

interface OffersLimitReachedClientProps {
  maxOffers: number
}

export function OffersLimitReachedClient({ maxOffers }: OffersLimitReachedClientProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-semibold mb-4">Osiągnięto limit ofert</h1>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Możesz utworzyć maksymalnie {maxOffers} ofert. Aby dodać nową ofertę, najpierw usuń jedną
          z istniejących.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button onClick={() => router.push('/app/collections/offers')}>Przejdź do ofert</Button>
          <Button buttonStyle="secondary" onClick={() => router.push('/app')}>
            Przejdź do dashboardu
          </Button>
        </div>
      </div>
    </div>
  )
}
