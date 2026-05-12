export type WizardStep = 'kind' | 'category' | 'tier' | 'interval' | 'summary'
export type WizardEntry = 'onboarding' | 'change-plan' | 'change-category'

export function wizardSequence(entry: WizardEntry, kind?: 'single' | 'multi'): WizardStep[] {
  if (entry === 'change-category') return ['category', 'interval', 'summary']
  const middle: WizardStep = kind === 'multi' ? 'tier' : 'category'
  const tail: WizardStep[] = entry === 'onboarding' ? ['interval'] : ['interval', 'summary']
  return ['kind', middle, ...tail]
}
