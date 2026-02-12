import type { StaticImageData } from 'next/image'

import { cn } from '@/lib/utils'
import React from 'react'
import { RichText } from '@/components/payload/RichText'
import type { MediaBlock as MediaBlockProps, OfferMediaBlock as OfferMediaBlockProps } from '@/payload-types'

import { Media } from '@/components/payload/Media'
import { MediaBlockWrapper } from './Wrapper'

type Props = (MediaBlockProps | OfferMediaBlockProps) & {
  id?: string | number
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

const orientationClasses: Record<string, { wrapper: string; img: string }> = {
  landscape: {
    wrapper: 'max-w-3xl mx-auto aspect-video',
    img: 'object-cover',
  },
  portrait: {
    wrapper: 'max-w-sm mx-auto aspect-[3/4]',
    img: 'object-cover',
  },
  square: {
    wrapper: 'max-w-md mx-auto aspect-square',
    img: 'object-cover',
  },
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
  } = props

  const orientation = 'orientation' in props && props.orientation ? props.orientation : 'landscape'
  const orientationStyle = orientationClasses[orientation] || orientationClasses.landscape

  return (
    <div
      className={cn(
        '',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      <MediaBlockWrapper className={cn('relative overflow-hidden rounded-[0.8rem] border-2 border-double border-muted-foreground/50 not-prose my-8', orientationStyle.wrapper)}>
        <Media
          fill
          htmlElement={null}
          imgClassName={cn(orientationStyle.img, imgClassName)}
          resource={media}
          src={staticImage}
        />
        {/* Inner shadow overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[0.8rem]"
          style={{ boxShadow: 'inset 0 2px 20px rgba(0, 0, 0, 0.25)' }}
        />
      </MediaBlockWrapper>
      {/* {caption && (
        <div
          className={cn(
            'mt-6',
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} />
        </div>
      )} */}
    </div>
  )
}
