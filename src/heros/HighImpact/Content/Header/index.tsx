import BlurText from '@/components/react-bits/BlurText'

export default function Header({ title }: { title: string }) {
  return (
    <h1 className="xl:text-8xl md:text-6xl text-5xl font-bebas max-w-7xl text-white mix-blend-difference transform-gpu">
      <BlurText text={title} animateBy="letters" direction="bottom" delay={50} />
    </h1>
  )
}
