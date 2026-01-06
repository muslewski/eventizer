import type { Page } from '@/payload-types'
import { CMSLink } from '@/components/payload/Link'
import { ArrowDown } from 'lucide-react'

interface ContentProps {
  links: Page['hero']['links']
  title: Page['hero']['title']
}

export const Content: React.FC<ContentProps> = ({ links, title }) => {
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

      {/* Header */}
      <h1 className="xl:text-8xl md:text-6xl text-5xl font-bebas max-w-6xl text-white mix-blend-difference">
        {title}
      </h1>

      <div className="w-full justify-between gap-6 flex border-white/10 border-t pt-8">
        <div className="flex gap-4">
          {/* Dummy div with dots green one */}
          <div className="h-4 w-8 bg-white/15 mix-blend-difference rounded-full" />
          <div className="h-4 w-16 bg-white/75 mix-blend-difference rounded-full" />
          <div className="h-4 w-8 bg-white/15 mix-blend-difference rounded-full" />
        </div>
        {/* Scroll indicator */}
        <div className="hidden sm:flex items-center gap-2 text-white/30 text-sm">
          <span className="uppercase tracking-widest text-xs">Scroll</span>
          <ArrowDown className="size-5 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
