'use client'

import { PositionedImage } from './PositionedImage'
import type { ImagePosition } from './types'

interface EditorPreviewPanelProps {
  imageUrl: string
  position: ImagePosition
}

/**
 * Right column of the editor modal — shows two live previews that re-render
 * whenever focal/zoom changes. Uses the exact PositionedImage component
 * that production surfaces use, so what the user sees here is what ships.
 */
export function EditorPreviewPanel({ imageUrl, position }: EditorPreviewPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Hero na stronie oferty
        </span>
        <div className="relative aspect-[21/9] overflow-hidden rounded-lg border border-border/40">
          <PositionedImage
            src={imageUrl}
            alt=""
            position={position}
            className="absolute inset-0"
            sizes="500px"
          />
          {/* Bottom band hints where the title sits on the real hero */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-black/60 to-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Karta na liście ofert (mobilna)
        </span>
        <div className="relative w-full max-w-[200px] aspect-[5/3] overflow-hidden rounded-lg border border-border/40">
          <PositionedImage
            src={imageUrl}
            alt=""
            position={position}
            className="absolute inset-0"
            sizes="200px"
          />
        </div>
      </div>
    </div>
  )
}
