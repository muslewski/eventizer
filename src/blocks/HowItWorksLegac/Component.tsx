import { HowItWorksClient } from '@/blocks/HowItWorks/Component.client'
import { type HowItWorksBlock as HowItWorksProps } from '@/payload-types'

export const HowItWorksBlock: React.FC<
  HowItWorksProps & {
    id?: string | number
    className?: string
  }
> = (props) => {
  return <HowItWorksClient {...props} />
}
