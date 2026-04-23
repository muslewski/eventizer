'use client'

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { cn } from '@/lib/utils'
import type { ImagePosition } from './types'

interface EditorCanvasProps {
  imageUrl: string
  position: ImagePosition
  onChange: (next: ImagePosition) => void
}

const ZOOM_STEP = 0.1
const FOCAL_NUDGE = 1
const FOCAL_NUDGE_LARGE = 10
const ZOOM_MIN = 1
const ZOOM_MAX = 3
const FOCAL_MIN = 0
const FOCAL_MAX = 100

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * The main editor canvas. Shows the image at its intrinsic aspect ratio
 * and lets the user place a focal point via drag / keyboard, plus zoom
 * via wheel / keyboard. No focalX/focalY sliders — the canvas IS the 2D
 * control.
 *
 * Accessibility:
 * - role="application", tabIndex=0 so the canvas receives focus.
 * - Arrow keys nudge focal; +/- zoom; 0 resets; Enter confirms (bubbles
 *   up as a key event so the parent dialog can hook it).
 * - The focal dot and rule-of-thirds overlay are aria-hidden.
 * - The parent dialog owns the aria-live announcement.
 */
export function EditorCanvas({ imageUrl, position, onChange }: EditorCanvasProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)

  const updateFocalFromPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 100
      const y = ((event.clientY - rect.top) / rect.height) * 100
      onChange({
        ...position,
        focalX: clamp(x, FOCAL_MIN, FOCAL_MAX),
        focalY: clamp(y, FOCAL_MIN, FOCAL_MAX),
      })
    },
    [onChange, position],
  )

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      isDragging.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      updateFocalFromPointer(event)
    },
    [updateFocalFromPointer],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return
      updateFocalFromPointer(event)
    },
    [updateFocalFromPointer],
  )

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    isDragging.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      onChange({
        ...position,
        zoom: clamp(position.zoom + delta, ZOOM_MIN, ZOOM_MAX),
      })
    },
    [onChange, position],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? FOCAL_NUDGE_LARGE : FOCAL_NUDGE
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          onChange({ ...position, focalX: clamp(position.focalX - step, FOCAL_MIN, FOCAL_MAX) })
          return
        case 'ArrowRight':
          event.preventDefault()
          onChange({ ...position, focalX: clamp(position.focalX + step, FOCAL_MIN, FOCAL_MAX) })
          return
        case 'ArrowUp':
          event.preventDefault()
          onChange({ ...position, focalY: clamp(position.focalY - step, FOCAL_MIN, FOCAL_MAX) })
          return
        case 'ArrowDown':
          event.preventDefault()
          onChange({ ...position, focalY: clamp(position.focalY + step, FOCAL_MIN, FOCAL_MAX) })
          return
        case '+':
        case '=':
          event.preventDefault()
          onChange({ ...position, zoom: clamp(position.zoom + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) })
          return
        case '-':
        case '_':
          event.preventDefault()
          onChange({ ...position, zoom: clamp(position.zoom - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) })
          return
        case '0':
          event.preventDefault()
          onChange({ focalX: 50, focalY: 50, zoom: 1 })
          return
      }
    },
    [onChange, position],
  )

  // Prevent the browser's default wheel-scroll when the canvas has focus
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: Event) => e.preventDefault()
    el.addEventListener('wheel', stop, { passive: false })
    return () => el.removeEventListener('wheel', stop)
  }, [])

  return (
    <div
      ref={ref}
      role="application"
      tabIndex={0}
      aria-label="Kadr zdjęcia — przeciągnij, aby ustawić punkt główny"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative w-fit max-w-full max-h-[420px] mx-auto rounded-lg overflow-hidden',
        'bg-muted cursor-grab active:cursor-grabbing',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      )}
    >
      {/* Intrinsic-aspect image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="block max-w-full max-h-[420px] w-auto h-auto select-none pointer-events-none"
      />

      {/* Rule-of-thirds overlay */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border-y border-dashed border-white/25" style={{ top: '33.33%', bottom: '66.66%' }} />
        <div className="absolute inset-0 border-y border-dashed border-white/25" style={{ top: '66.66%', bottom: '33.33%' }} />
        <div className="absolute inset-0 border-x border-dashed border-white/25" style={{ left: '33.33%', right: '66.66%' }} />
        <div className="absolute inset-0 border-x border-dashed border-white/25" style={{ left: '66.66%', right: '33.33%' }} />
      </div>

      {/* Focal dot */}
      <div
        aria-hidden="true"
        className="absolute size-4 -mt-2 -ml-2 rounded-full bg-accent border-2 border-white shadow-lg pointer-events-none"
        style={{ top: `${position.focalY}%`, left: `${position.focalX}%` }}
      />
    </div>
  )
}
