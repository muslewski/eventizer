import type { Page } from '@/payload-types'
import { CMSLink } from '@/components/payload/Link'
import { ArrowDown } from 'lucide-react'
import { Stats } from '@/heros/MediumImpact/Content/Stats'
import BlurText from '@/components/react-bits/BlurText'
// import Header from '@/heros/HighImpact/Content/Header'

interface ContentProps {
  links: Page['hero']['links']
  // title: Page['hero']['title']
  showScrollIndicator: Page['hero']['showScrollIndicator']
  infoTitle1?: Page['hero']['informationTitle1']
  infoValue1?: Page['hero']['informationValue1']
  infoTitle2?: Page['hero']['informationTitle2']
  infoValue2?: Page['hero']['informationValue2']
}

export const Content: React.FC<ContentProps> = ({
  links,
  showScrollIndicator,
  infoTitle1,
  infoValue1,
  infoTitle2,
  infoValue2,
}) => {
  return (
    <div className="h-full relative flex flex-col justify-end gap-10 bg-linear-t">
      {/* Links */}
      {Array.isArray(links) && links.length > 0 && (
        <ul className="flex gap-4">
          {links.map(({ link }, i) => {
            return (
              <li key={i}>
                <CMSLink {...link} />
              </li>
            )
          })}
        </ul>
      )}

      {/* Stats */}
      <Stats
        infoTitle1={infoTitle1}
        infoValue1={infoValue1}
        infoTitle2={infoTitle2}
        infoValue2={infoValue2}
      />

      {/* Trusted Us */}
      <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 2xl:gap-12">
        <h3 className="xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas max-w-7xl text-white mix-blend-difference transform-gpu">
          {/* Zaufali nam najlepsi */}
          <BlurText text="Zaufali nam najlepsi" animateBy="letters" direction="bottom" delay={50} />
        </h3>

        <div className="flex">
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full" />
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full -ml-4 md:-ml-6" />
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full -ml-4 md:-ml-6" />
          <div className="size-16 md:size-24 bg-white/15 mix-blend-difference rounded-full -ml-4 md:-ml-6" />
        </div>
      </div>

      <div className="w-full justify-between gap-6 flex border-white/10 border-t pt-8">
        <div className="flex gap-4">
          {/* Dummy div with dots green one */}
          <div className="h-4 w-8 bg-white/15 mix-blend-difference rounded-full" />
          <div className="h-4 w-16 bg-white/75 mix-blend-difference rounded-full" />
          <div className="h-4 w-8 bg-white/15 mix-blend-difference rounded-full" />
        </div>
        {/* Scroll indicator */}
        {showScrollIndicator && (
          <div className="hidden sm:flex items-center gap-2 text-white/30 text-sm">
            <span className="uppercase tracking-widest text-xs">Scroll</span>
            <ArrowDown className="size-5 animate-bounce" />
          </div>
        )}
      </div>
    </div>
  )
}
