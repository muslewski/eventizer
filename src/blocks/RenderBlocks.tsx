// import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
// import { CarouselBlock } from '@/blocks/Carousel/Component'
import { ComingSoonBlock } from '@/blocks/ComingSoon/Component'
import { ContentBlock } from '@/blocks/Content/Component'
// import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
// import { ThreeItemGridBlock } from '@/blocks/ThreeItemGrid/Component'
import { toKebabCase } from '@/utilities/toKebabCase'
import React, { Fragment } from 'react'

import type { Page } from '../payload-types'
import { FeaturedOffersBlock } from '@/blocks/FeaturedOffers/Component'
import { HowItWorksBlock } from '@/blocks/HowItWorks/Component'
import { SocialMediaBlock } from '@/blocks/SocialMedia/Component'
import { ServiceCategoriesBlock } from '@/blocks/ServiceCategories/Component'

const blockComponents = {
  //   archive: ArchiveBlock,
  banner: BannerBlock,
  //   carousel: CarouselBlock,
  comingSoon: ComingSoonBlock,
  featuredOffers: FeaturedOffersBlock,
  howItWorks: HowItWorksBlock,
  socialMedia: SocialMediaBlock,
  serviceCategories: ServiceCategoriesBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  //   formBlock: FormBlock,
  mediaBlock: MediaBlock,
  //   threeItemGrid: ThreeItemGridBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="" key={index}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore - weird type mismatch here */}
                  <Block id={toKebabCase(blockName!)} {...block} />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
