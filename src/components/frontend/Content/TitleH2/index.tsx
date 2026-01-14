import BlurText from '@/components/react-bits/BlurText'

export const TitleH2 = ({
  title,
  align,
}: {
  title: string
  align?: 'left' | 'center' | 'right'
}) => {
  return (
    <h2 className="font-bebas w-fit text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center tracking-wide leading-[0.9] mb-6">
      <BlurText text={title} animateBy="letters" direction="bottom" delay={50} align={align} />
    </h2>
  )
}
