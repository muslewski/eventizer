import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function OfferCardSkeleton() {
  return (
    <Card className="w-full flex xl:flex-row flex-col py-0 sm:py-0 h-120 sm:h-130 xl:h-48 items-center bg-transparent bg-linear-to-r from-stone-200 dark:from-stone-900/60 to-background/35 rounded-2xl overflow-hidden">
      {/* Image skeleton */}
      <div className="w-full xl:max-w-3xs h-full rounded-2xl relative overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      </div>

      {/* Content skeleton */}
      <div className="xl:pb-6 xl:pt-6 sm:pb-6 sm:pt-0 pb-6 pt-6 flex flex-col lg:flex-row gap-8 justify-between w-full min-w-0 px-6 xl:px-0 xl:pr-6">
        <div className="w-full flex flex-col gap-3">
          {/* Title */}
          <Skeleton className="h-8 w-3/4" />

          {/* Description lines */}
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Tags */}
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>

        {/* Price + button */}
        <div className="flex flex-row gap-3 flex-wrap lg:flex-col items-start lg:items-end justify-between w-full lg:w-fit">
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </Card>
  )
}
