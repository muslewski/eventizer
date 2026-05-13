import {
  Building2Icon,
  BoxesIcon,
  SparklesIcon,
  TargetIcon,
  type LucideIcon,
} from 'lucide-react'
import type { SubscriptionPlan } from '@/payload-types'

export interface PlanInfo {
  icon: LucideIcon
  tagline: string
  bullets: string[]
}

/**
 * Marketing copy + icon for a plan, displayed on the subscription status card.
 *
 * Intentionally shorter than the wizard's option cards — this version is a
 * reminder of what the user already has, not a sales pitch. Two or three
 * bullets keep the status card scannable.
 *
 * Resolution by `maxOffers` mirrors `resolveCurrentPlanByMaxOffers` (1 →
 * Single, 4 → Multi, 10 → Agency). Beta is special-cased.
 */
export function getPlanInfo(
  plan: SubscriptionPlan | null | undefined,
  isBeta: boolean,
): PlanInfo {
  if (isBeta) {
    return {
      icon: SparklesIcon,
      tagline: 'Wczesny dostęp dla zaproszonych użytkowników',
      bullets: [
        'Pełna funkcjonalność platformy',
        'Bez opłat w okresie testowym',
      ],
    }
  }

  const maxOffers = plan?.maxOffers ?? 1

  if (maxOffers >= 10) {
    return {
      icon: Building2Icon,
      tagline: 'Dla firm z szeroką ofertą usług',
      bullets: [
        `Do ${maxOffers} różnych usług`,
        'Obecność w wielu kategoriach',
        'Idealne dla agencji i większych firm',
      ],
    }
  }

  if (maxOffers >= 4) {
    return {
      icon: BoxesIcon,
      tagline: 'Dla firm oferujących kilka różnych usług',
      bullets: [
        `Do ${maxOffers} różnych usług`,
        'Każda usługa w osobnej kategorii',
        'Lepsza prezentacja Twojej działalności',
      ],
    }
  }

  return {
    icon: TargetIcon,
    tagline: 'Skup się na jednej usłudze',
    bullets: [
      'Jedna główna usługa',
      'Widoczność w wybranej kategorii',
      'Prosty start bez zbędnych opcji',
    ],
  }
}
