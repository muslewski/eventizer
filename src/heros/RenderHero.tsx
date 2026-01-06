import { HighImpactHero } from '@/heros/HighImpact'
import { Page } from '@/payload-types'

const heroes = {
  highImpact: HighImpactHero,
}

export const RenderHero: React.FC<Page['hero']> = (props) => {
  const { type } = props || {}

  if (!type || type === 'none') return null

  const HeroToRender = heroes[type]

  if (!HeroToRender) return null

  return <HeroToRender {...props} />
}
