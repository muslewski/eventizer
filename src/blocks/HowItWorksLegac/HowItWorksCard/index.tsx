import { Card, CardHeader } from '@/components/ui/card'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { cn } from '@/lib/utils'
import type { HowItWorksBlock, Media } from '@/payload-types'
import Image from 'next/image'
import arrowDown from '@/assets/howItWorks/line-down.png'
import arrowDownSecond from '@/assets/howItWorks/line-down-2.png'

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
    <div
      className={cn(
        'relative w-full h-fit max-w-4xl',
        stepNumber % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto',
      )}
    >
      <Card
        className={cn(
          'relative w-full border-white/50 inset-shadow-[2px_2px_8px_rgba(0,0,0,0.5)] bg-transparent bg-linear-to-br from-background/50 to-background/35 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',
          isServiceProvider ? 'via-purple-500/15' : 'via-blue-500/15',
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

      {/* Decorative arrow down - outside the card */}
      {stepNumber < 4 && stepNumber > 1 && (
        <div
          className={cn(
            'absolute hidden sm:block size-32 md:size-64 pointer-events-none bottom-72 md:bottom-52',
            stepNumber % 2 === 0
              ? 'right-8 md:right-16 xl:right-42'
              : 'left-8 md:left-16 xl:left-42',
          )}
        >
          <Image
            src={stepNumber % 2 === 0 ? arrowDown : arrowDownSecond}
            alt=""
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  )
}
