import { SocialMediaClient } from '@/blocks/SocialMedia/Component.client'
import { type SocialMediaBlock as SocialMediaProps } from '@/payload-types'

export const SocialMediaBlock: React.FC<
  SocialMediaProps & {
    id?: string | number
    className?: string
  }
> = (props) => {
  return <SocialMediaClient {...props} />
}
