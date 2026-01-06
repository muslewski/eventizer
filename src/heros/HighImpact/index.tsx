'use client'

import { Media, type Page } from '@/payload-types'
import { useEffect } from 'react'
import { useHeaderTheme } from '@/components/providers/HeaderTheme'
import { CMSLink } from '@/components/payload/Link'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import './styles.css'
import { isSafari } from '@/utilities/isSafari'
import { cn } from '@/lib/utils'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, backgroundImage, title }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [])

  const safari = isSafari()

  return (
    <div
      className="h-[calc(100vh-64px)] rounded-2xl overflow-hidden py-16 px-16 relative"
      data-theme="dark"
    >
      {/* Background image */}
      {backgroundImage && isExpandedDoc<Media>(backgroundImage) && (
        <div
          className={cn(
            'absolute top-0 left-0 w-full h-full z-0 bg-cover bg-fixed bg-center hero-bg',
            safari && 'bg-local',
          )}
          style={{ backgroundImage: `url(${backgroundImage.url})` }}
        ></div>
      )}

      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-[#121212]/0 to-black/80" />

      {/* Content wrapper */}
      <div className="h-full relative flex flex-col justify-end gap-12 bg-linear-t">
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

        {/* Header */}
        <h1 className="xl:text-8xl md:text-6xl sm:text-5xl text-4xl font-bebas max-w-6xl text-white mix-blend-difference">
          {title}
        </h1>

        <div>
          {/* Dummy div with dots green one */}
          <div className="h-4 w-4 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
