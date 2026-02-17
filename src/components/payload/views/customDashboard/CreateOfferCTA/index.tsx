import Link from 'next/link'
import { Plus } from 'lucide-react'

export function CreateOfferCTA() {
  return (
    <Link
      href="/app/collections/offers/create"
      className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/15 hover:border-accent/50 w-fit"
    >
      <Plus className="h-4 w-4" />
      Stwórz nową ofertę
    </Link>
  )
}
