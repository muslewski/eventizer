import { describe, it, expect } from 'vitest'
import { wizardSequence } from '@/components/panel/plan-subskrypcji/lib/wizardSequence'

describe('wizardSequence', () => {
  it.each([
    ['onboarding', 'single', ['kind', 'category', 'interval']],
    ['onboarding', 'multi', ['kind', 'tier', 'interval']],
    ['change-plan', 'single', ['kind', 'category', 'interval', 'summary']],
    ['change-plan', 'multi', ['kind', 'tier', 'interval', 'summary']],
    ['change-category', undefined, ['category', 'interval', 'summary']],
  ] as const)('(%s, %s) → %s', (entry, kind, expected) => {
    expect(wizardSequence(entry as any, kind as any)).toEqual(expected)
  })
})
