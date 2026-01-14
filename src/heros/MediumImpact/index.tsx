import type { Page } from '@/payload-types'
import { MediumImpactHeroClient } from './index.client'
import { Background } from './Background'
import { Content } from './Content'

export const MediumImpactHero: React.FC<
  Page['hero'] & { customReactComponent?: React.ReactNode }
> = ({
  links,
  backgroundImage,
  backgroundVideo,
  title,
  showScrollIndicator,
  informationTitle1,
  informationValue1,
  informationTitle2,
  informationValue2,
  customReactComponent,
}) => {
  return (
    <MediumImpactHeroClient>
      <div className="h-full w-full xl:w-1/2 rounded-2xl overflow-hidden relative pb-8 sm:pb-16 pt-16 px-8 sm:px-16 bg-background">
        <Background backgroundImage={backgroundImage} backgroundVideo={backgroundVideo} />
        <Content
          links={links}
          showScrollIndicator={showScrollIndicator}
          infoTitle1={informationTitle1}
          infoValue1={informationValue1}
          infoTitle2={informationTitle2}
          infoValue2={informationValue2}
        />
      </div>
      {/* Right half */}
      <div className="h-fit w-full xl:w-1/2 flex items-start justify-center xl:justify-start sm:mt-8 xl:mt-16 mb-8 xl:mb-0 px-4 sm:px-16">
        {customReactComponent}
      </div>
    </MediumImpactHeroClient>
  )
}
