import type { Page } from '@/payload-types'
import { HighImpactHeroClient } from './index.client'
import { Background } from './Background'
import { Content } from './Content'

export const HighImpactHero: React.FC<Page['hero']> = ({
  links,
  backgroundImage,
  backgroundVideo,
  title,
  showScrollIndicator,
}) => {
  return (
    <HighImpactHeroClient>
      <Background backgroundImage={backgroundImage} backgroundVideo={backgroundVideo} />
      <Content links={links} title={title} showScrollIndicator={showScrollIndicator} />
    </HighImpactHeroClient>
  )
}
