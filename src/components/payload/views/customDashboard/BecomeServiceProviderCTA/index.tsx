import Link from 'next/link'
import { Briefcase, ArrowRight } from 'lucide-react'

export function BecomeServiceProviderCTA() {
  return (
    <Link
      href="/app/onboarding/service-provider"
      className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/15 hover:border-accent/50 w-fit no-underline"
    >
      <Briefcase className="h-4 w-4" />
      Zostań usługodawcą
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}
