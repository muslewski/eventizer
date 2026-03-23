import { VideoClient } from '@/blocks/Video/Component.client'
import { type VideoBlock as VideoBlockProps, type Media } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'

export const VideoBlock: React.FC<
  VideoBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ heading, description, video, aspectRatio, className }) => {
  const videoData = isExpandedDoc<Media>(video) ? video : null

  if (!videoData?.url) return null

  return (
    <VideoClient
      heading={heading}
      description={description}
      videoUrl={videoData.url}
      videoTitle={videoData.alt || heading}
      mimeType={videoData.mimeType ?? 'video/mp4'}
      aspectRatio={aspectRatio ?? undefined}
      className={className}
    />
  )
}
