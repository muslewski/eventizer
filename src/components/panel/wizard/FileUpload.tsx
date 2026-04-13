'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { UploadCloudIcon, XIcon, GripVerticalIcon, Loader2Icon, ImageIcon, FilmIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Upload utility ───────────────────────────────────────────────────────────

interface UploadedFile {
  id: number
  url: string
  filename: string
}

async function waitForDocument(collection: string, id: number, maxRetries = 12, delay = 250) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(`/api/${collection}/${id}?depth=0`, {
      method: 'GET',
      credentials: 'include',
    })
    if (res.ok) return
    await new Promise((r) => setTimeout(r, delay))
  }
}

async function uploadFile(file: File, collection: string): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`/api/${collection}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.errors?.[0]?.message ?? `Upload nie powiódł się (HTTP ${res.status})`)
  }

  const { doc } = await res.json()
  await waitForDocument(collection, doc.id)

  return { id: doc.id, url: doc.url, filename: doc.filename }
}

// ── Single Image Upload ──────────────────────────────────────────────────────

interface SingleImageUploadProps {
  value: UploadedFile | null
  onChange: (file: UploadedFile | null) => void
  label?: string
  required?: boolean
}

export function SingleImageUpload({ value, onChange, label, required }: SingleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadFile(file, 'offer-uploads')
      onChange(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload nie powiódł się')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFileSelect(file)
  }, [handleFileSelect])

  return (
    <div className="flex flex-col gap-2">
      {value?.url ? (
        <div className="group relative aspect-video max-w-md overflow-hidden rounded-lg border border-border/20">
          <Image src={value.url} alt="" fill className="object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Zmień
            </Button>
            {!required && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(null)}
              >
                <XIcon data-icon="inline-start" />
                Usuń
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            'flex h-36 max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
            isUploading ? 'border-accent/40 bg-accent/5' : 'border-border/30 hover:border-accent/30 hover:bg-accent/5',
          )}
        >
          {isUploading ? (
            <Loader2Icon className="size-6 animate-spin text-accent" />
          ) : (
            <>
              <ImageIcon className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {label || 'Kliknij lub przeciągnij zdjęcie'}
              </span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Gallery Upload (multi, reorderable) ──────────────────────────────────────

interface GalleryUploadProps {
  value: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
}

export function GalleryUpload({ value, onChange }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragItem = useRef<number | null>(null)

  const handleFilesSelect = useCallback(async (files: FileList) => {
    setIsUploading(true)
    setError(null)

    try {
      const newItems: UploadedFile[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const result = await uploadFile(file, 'offer-uploads')
        newItems.push(result)
      }
      onChange([...value, ...newItems])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload nie powiódł się')
    } finally {
      setIsUploading(false)
    }
  }, [value, onChange])

  const handleRemove = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }, [value, onChange])

  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragItem.current === null || dragItem.current === index) return

    const newItems = [...value]
    const [moved] = newItems.splice(dragItem.current, 1)
    newItems.splice(index, 0, moved)
    dragItem.current = index
    onChange(newItems)
  }

  const handleDragEnd = () => {
    dragItem.current = null
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border/20"
            >
              <Image src={item.url} alt="" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute left-1 top-1 cursor-grab">
                  <GripVerticalIcon className="size-4 text-white/70" />
                </div>
                <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                  {index + 1}
                </Badge>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="size-7"
                  onClick={() => handleRemove(index)}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files.length) handleFilesSelect(e.dataTransfer.files)
        }}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors',
          isUploading ? 'border-accent/40 bg-accent/5' : 'border-border/30 hover:border-accent/30 hover:bg-accent/5',
        )}
      >
        {isUploading ? (
          <Loader2Icon className="size-5 animate-spin text-accent" />
        ) : (
          <>
            <UploadCloudIcon className="size-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Dodaj zdjęcia do galerii</span>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFilesSelect(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ── Video Upload ─────────────────────────────────────────────────────────────

interface VideoUploadProps {
  value: UploadedFile | null
  onChange: (file: UploadedFile | null) => void
}

export function VideoUpload({ value, onChange }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadFile(file, 'offer-video-uploads')
      onChange(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload nie powiódł się')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  return (
    <div className="flex flex-col gap-2">
      {value?.url ? (
        <div className="flex flex-col gap-2">
          <div className="relative max-w-md overflow-hidden rounded-lg border border-border/20">
            <video
              src={value.url}
              controls
              className="w-full"
              preload="metadata"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Zmień wideo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <XIcon data-icon="inline-start" />
              Usuń
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file?.type.startsWith('video/')) handleFileSelect(file)
          }}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            'flex h-28 max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
            isUploading ? 'border-accent/40 bg-accent/5' : 'border-border/30 hover:border-accent/30 hover:bg-accent/5',
          )}
        >
          {isUploading ? (
            <>
              <Loader2Icon className="size-6 animate-spin text-accent" />
              <span className="text-xs text-muted-foreground">Przesyłanie wideo...</span>
            </>
          ) : (
            <>
              <FilmIcon className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Kliknij lub przeciągnij wideo</span>
              <span className="text-xs text-muted-foreground/60">Max 50MB · MP4, WebM, MOV</span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
