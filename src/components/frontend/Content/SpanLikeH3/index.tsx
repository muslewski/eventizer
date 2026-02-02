import BlurText from '@/components/react-bits/BlurText'

export const SpanLikeH3 = ({
  title,
  align,
}: {
  title: string
  align?: 'left' | 'center' | 'right'
}) => {
  return (
    <span className="xl:text-5xl w-fit md:text-4xl sm:text-3xl text-2xl font-bebas max-w-7xl text-foreground leading-[0.9]">
      <BlurText text={title} animateBy="letters" direction="bottom" delay={50} align={align} />
    </span>
  )
}
