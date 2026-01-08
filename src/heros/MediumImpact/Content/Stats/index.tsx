import type { Page } from '@/payload-types'

interface StatsProps {
  infoTitle1?: Page['hero']['informationTitle1']
  infoValue1?: Page['hero']['informationValue1']
  infoTitle2?: Page['hero']['informationTitle2']
  infoValue2?: Page['hero']['informationValue2']
}

export const Stats: React.FC<StatsProps> = ({ infoTitle1, infoValue1, infoTitle2, infoValue2 }) => {
  return (
    <div className="flex flex-row 2xl:flex-col gap-4 sm:gap-6 md:gap-8 2xl:gap-12 text-white pt-8 sm:pt-16 h-full">
      <div className="flex flex-col gap-0 2xl:gap-2">
        <h2 className="xl:text-8xl md:text-6xl text-5xl font-bebas max-w-7xl text-white mix-blend-difference transform-gpu">
          {infoTitle1}
        </h2>
        <p className="text-white/70">{infoValue1}</p>
      </div>

      <div className="flex flex-col gap-0 2xl:gap-2">
        <h2 className="xl:text-8xl md:text-6xl text-5xl font-bebas max-w-7xl text-white mix-blend-difference transform-gpu">
          {infoTitle2}
        </h2>
        <p className="text-white/70">{infoValue2}</p>
      </div>
    </div>
  )
}
