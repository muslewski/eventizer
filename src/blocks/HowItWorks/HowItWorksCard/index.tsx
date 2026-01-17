import { Card, CardHeader } from '@/components/ui/card'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import type { HowItWorksBlock, Media } from '@/payload-types'
import Image from 'next/image'

type Step = HowItWorksBlock['client']['step1']

type HowItWorksCardProps = Step & {
  stepNumber: number
}

export default function HowItWorksCard({
  header,
  description,
  media,
  stepNumber,
}: HowItWorksCardProps) {
  const mainImage = isExpandedDoc<Media>(media) ? media : null

  return (
    <Card className="relative w-full max-w-2xl border-white/50 inset-shadow-[2px_2px_8px_rgba(0,0,0,0.5)] bg-linear-to-r from-background via-blue-500/25 to-background/55">
      {/* Absolute number */}
      <div className="absolute bg-linear-to-b from-foreground to-stone-700 dark:to-stone-500 text-background size-16 -top-8 -left-8 text-4xl flex justify-center items-center rounded-full font-montserrat font-black select-none pointer-events-none border border-foreground">
        <p>{stepNumber}</p>
      </div>
      <CardHeader className="w-full flex gap-6">
        <div className="rounded-xl max-w-md min-h-48 w-full overflow-hidden relative">
          <Image
            src={mainImage?.url || '/placeholder-image.png'}
            alt={mainImage?.alt || 'How It Works Step Image'}
            className="object-cover"
            fill
          />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-bebas text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">{header}</h3>
          <p>{description}</p>
        </div>
      </CardHeader>
    </Card>
  )
}
