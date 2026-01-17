import { Card, CardHeader } from '@/components/ui/card'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { cn } from '@/lib/utils'
import type { HowItWorksBlock, Media } from '@/payload-types'
import Image from 'next/image'

type Step = HowItWorksBlock['client']['step1']

type HowItWorksCardProps = Step & {
  stepNumber: number
  isServiceProvider?: boolean
}

export default function HowItWorksCard({
  header,
  description,
  media,
  stepNumber,
  isServiceProvider = false,
}: HowItWorksCardProps) {
  const mainImage = isExpandedDoc<Media>(media) ? media : null

  return (
    <Card
      className={cn(
        'relative w-full max-w-4xl border-white/50 inset-shadow-[2px_2px_8px_rgba(0,0,0,0.5)] bg-linear-to-r from-background to-background/55',
        isServiceProvider ? 'via-purple-500/25' : 'via-blue-500/25',
      )}
    >
      {/* Absolute number */}
      <div className="absolute bg-linear-to-b from-foreground to-stone-700 dark:to-stone-500 text-background size-12 sm:size-16 -top-6 -left-6 sm:-top-8 sm:-left-8 text-2xl sm:text-4xl flex justify-center items-center rounded-full font-montserrat font-black select-none pointer-events-none border border-foreground">
        <p>{stepNumber}</p>
      </div>
      <CardHeader className="w-full flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
        <div className="rounded-xl w-full sm:w-48 md:w-56 lg:w-80 h-40 sm:h-48 shrink-0 overflow-hidden relative">
          <Image
            src={mainImage?.url || '/placeholder-image.png'}
            alt={mainImage?.alt || 'How It Works Step Image'}
            className="object-cover"
            fill
          />
        </div>
        <div className="flex flex-col gap-2 h-full">
          <h3 className="font-bebas text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">{header}</h3>
          <p className="text-sm sm:text-base">{description}</p>
        </div>
      </CardHeader>
    </Card>
  )
}
