'use client'

import { TitleH2 } from '@/components/frontend/Content/TitleH2'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type HowItWorksBlock as HowItWorksProps } from '@/payload-types'
import { useState } from 'react'

interface HowItWorksClientProps extends HowItWorksProps {
  className?: string
}

export const HowItWorksClient: React.FC<HowItWorksClientProps> = ({
  heading,
  description,
  client,
  serviceProvider,
  className,
}) => {
  const [isSelectedClient, setIsSelectedClient] = useState(true)

  return (
    <div className={cn('flex flex-col items-center gap-8', className)}>
      <div className="flex flex-col items-center">
        <TitleH2 align="center" title={heading} />
        <p>{description}</p>
      </div>

      {/* Display switch button */}
      <div className="w-full max-w-xl py-2 flex">
        <Button
          variant={isSelectedClient ? 'default' : 'outline'}
          onClick={() => setIsSelectedClient(true)}
          className="w-1/2 rounded-l-full rounded-r-none"
        >
          Klient
        </Button>
        <Button
          variant={!isSelectedClient ? 'default' : 'outline'}
          onClick={() => setIsSelectedClient(false)}
          className="w-1/2 rounded-l-none rounded-r-full"
        >
          Usługodawca
        </Button>
      </div>

      {/* Display content based on selection */}
      <div className="w-full max-w-4xl">
        {isSelectedClient ? JSON.stringify(client) : JSON.stringify(serviceProvider)}
      </div>
    </div>
  )
}
