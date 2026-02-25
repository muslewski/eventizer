import type { Page } from '@/payload-types'
import { HighImpactHeroClient } from './index.client'
import { Background } from './Background'
import { Content } from './Content'

type HighImpactHeroProps = Page['hero'] & {
  /** Optional custom content to replace the default Content component */
  children?: React.ReactNode
}

export const HighImpactHero: React.FC<HighImpactHeroProps> = ({
  links,
  backgroundImage,
  backgroundVideo,
  lightBackgroundImage,
  lightBackgroundVideo,
  title,
  showScrollIndicator,
  children,
}) => {
  return (
    <HighImpactHeroClient>
      <Background
        backgroundImage={backgroundImage}
        backgroundVideo={backgroundVideo}
        lightBackgroundImage={lightBackgroundImage}
        lightBackgroundVideo={lightBackgroundVideo}
      />
      {children ? (
        children
      ) : (
        <Content links={links} title={title} showScrollIndicator={showScrollIndicator} />
      )}
    </HighImpactHeroClient>
  )
}
