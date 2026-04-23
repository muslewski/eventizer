'use client'

import { Slider } from '@/components/ui/slider'

interface EditorZoomSliderProps {
  zoom: number
  onChange: (next: number) => void
}

/**
 * Single zoom slider — no focalX/focalY sliders; the canvas drag/keyboard
 * is the 2D control.
 */
export function EditorZoomSlider({ zoom, onChange }: EditorZoomSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor="image-position-zoom" className="text-muted-foreground">
          Przybliżenie
        </label>
        <span className="tabular-nums font-medium">{zoom.toFixed(1)}×</span>
      </div>
      <Slider
        id="image-position-zoom"
        min={1}
        max={3}
        step={0.1}
        value={[zoom]}
        onValueChange={(values) => onChange(values[0])}
      />
    </div>
  )
}
