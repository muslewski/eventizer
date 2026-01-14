'use client'

import { type HowItWorksBlock as HowItWorksProps } from '@/payload-types'

interface HowItWorksClientProps extends HowItWorksProps {
  className?: string
}

export const HowItWorksClient: React.FC<HowItWorksClientProps> = ({
  heading,
  description,
  client,
  serviceProvider,
  className,
}) => {
  return (
    <div className={className}>
      <h2>{heading}</h2>
      <p>{description}</p>
      <div>Dummy HowItWorks Component</div>
    </div>
  )
}
