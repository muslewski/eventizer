import BlurText from '@/components/react-bits/BlurText'

export const ParagraphLikeH3 = ({
  title,
  align,
}: {
  title: string
  align?: 'left' | 'center' | 'right'
}) => {
  return (
    <h3 className="xl:text-5xl w-fit md:text-4xl sm:text-3xl text-2xl font-bebas max-w-7xl text-foreground leading-[0.9]">
      <BlurText text={title} animateBy="letters" direction="bottom" delay={50} align={align} />
    </h3>
  )
}
