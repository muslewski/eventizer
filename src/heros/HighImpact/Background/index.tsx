import { Media, type Page } from '@/payload-types'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import { cn } from '@/lib/utils'
import { isSafari } from '@/utilities/isSafari'

interface BackgroundProps {
  backgroundImage: Page['hero']['backgroundImage']
}

// TODO:
// - Add parallax effect / fixed background

export const Background: React.FC<BackgroundProps> = ({ backgroundImage }) => {
  return (
    <>
      {/* Background image */}
      {backgroundImage && isExpandedDoc<Media>(backgroundImage) && (
        <div
          className={cn(
            'absolute top-0 left-0 w-full h-full z-0 bg-cover bg-center animate-zoom-in',
          )}
          style={{
            backgroundImage: `url(${backgroundImage.url})`,
            boxShadow: 'inset 0 4px 61.4px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Animated noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.2] mix-blend-hard-light pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Background horizontal lines */}
      <div className="absolute inset-0 flex items-end justify-between pointer-events-none">
        <div className="h-[calc(100%-64px)] w-full bg-black/0 backdrop-blur-sm flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-t from-black/35" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden md:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/35" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 backdrop-blur-sm hidden md:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-t from-black/35" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden md:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden sm:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-transparent" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/35" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 backdrop-blur-sm flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/30" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden sm:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-t from-black/35 to-transparent" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-t from-black/35 via-black/10" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden sm:flex justify-end backdrop-blur-sm">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/40" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/30 via-transparent" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-t from-black/35 via-black/10" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-t from-black/35 via-black/20" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/35 via-black/35" />
        </div>

        <div className="h-[calc(100%-64px)] w-full bg-black/0 hidden xl:flex justify-end">
          <div className="h-full w-0.5 bg-linear-to-b from-black/40 via-transparent" />
        </div>
      </div>

      {/* Primary gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-black/30 to-black/90" />

      {/* Accent color glow */}
      <div className="absolute bottom-0 left-5/6 sm:left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-50 " />
    </>
  )
}
