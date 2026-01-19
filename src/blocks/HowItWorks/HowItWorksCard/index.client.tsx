'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type HowItWorksImageProps = {
  src: string
  alt: string
}

export function HowItWorksImage({ src, alt }: HowItWorksImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className="rounded-xl w-full sm:w-48 md:w-56 lg:w-80 h-40 sm:h-48 shrink-0 overflow-hidden relative">
      {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />}
      <Image
        src={src}
        alt={alt}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
        )}
        fill
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  )
}
