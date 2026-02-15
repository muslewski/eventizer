import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      data-shadcn
      className={cn('bg-background animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export { Skeleton }
