'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { EditorCanvas } from './EditorCanvas'
import { EditorZoomSlider } from './EditorZoomSlider'
import { EditorPreviewPanel } from './EditorPreviewPanel'
import { DEFAULT_POSITION, resolvePosition, type ImagePosition } from './types'

type Result = { ok: true } | { ok: false; error: string }

interface ImagePositionEditorProps {
  imageUrl: string
  initialPosition?: Partial<ImagePosition> | null
  onConfirm: (position: ImagePosition) => Promise<Result> | Result
  /** Uncontrolled: the child becomes the DialogTrigger. */
  children?: ReactNode
  /** Controlled — optional. If provided, the editor is controlled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function formatLiveRegion(position: ImagePosition): string {
  return `Punkt główny: poziom ${Math.round(position.focalX)}%, pion ${Math.round(position.focalY)}%, przybliżenie ${Math.round(position.zoom * 100)}%`
}

export function ImagePositionEditor({
  imageUrl,
  initialPosition,
  onConfirm,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ImagePositionEditorProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(next)
      } else {
        setUncontrolledOpen(next)
      }
    },
    [controlledOnOpenChange, isControlled],
  )

  const initial = useMemo(() => resolvePosition(initialPosition), [initialPosition])
  const [position, setPosition] = useState<ImagePosition>(initial)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState<string>(formatLiveRegion(initial))
  const liveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset local state whenever the dialog opens with fresh inputs
  useEffect(() => {
    if (open) {
      setPosition(initial)
      setErrorMessage(null)
      setLiveMessage(formatLiveRegion(initial))
    }
  }, [open, initial])

  // Debounce live-region updates so screen readers don't spam on drag
  useEffect(() => {
    if (liveTimer.current) clearTimeout(liveTimer.current)
    liveTimer.current = setTimeout(() => {
      setLiveMessage(formatLiveRegion(position))
    }, 500)
    return () => {
      if (liveTimer.current) clearTimeout(liveTimer.current)
    }
  }, [position])

  const handleReset = useCallback(() => {
    setPosition(DEFAULT_POSITION)
    setErrorMessage(null)
  }, [])

  const handleSave = useCallback(async () => {
    setIsPending(true)
    setErrorMessage(null)
    try {
      const result = await onConfirm(position)
      if (result.ok) {
        setOpen(false)
      } else {
        setErrorMessage(result.error)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Nie udało się zapisać kadru')
    } finally {
      setIsPending(false)
    }
  }, [onConfirm, position, setOpen])

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="max-w-5xl w-full"
        // Block Escape and outside-click while saving
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (isPending) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Dostosuj kadr głównego zdjęcia</DialogTitle>
          <DialogDescription>
            Przeciągnij na zdjęciu, aby ustawić punkt główny. Użyj rolki lub suwaka, aby przybliżyć.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-4 md:gap-6">
          <div className="flex flex-col gap-3">
            <EditorCanvas imageUrl={imageUrl} position={position} onChange={setPosition} />
            <EditorZoomSlider
              zoom={position.zoom}
              onChange={(zoom) => setPosition((p) => ({ ...p, zoom }))}
            />
          </div>
          <EditorPreviewPanel imageUrl={imageUrl} position={position} />
        </div>

        {/* aria-live region for screen readers */}
        <div className="sr-only" aria-live="polite">{liveMessage}</div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleReset} disabled={isPending}>
            Wyśrodkuj
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Anuluj
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              Zapisz kadr
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
