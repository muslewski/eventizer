'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { Upload, X, CheckCircle, AlertCircle, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileState {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForUploadDocument(uploadId: number, maxRetries = 12, delayMs = 250): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(`/api/offer-uploads/${uploadId}?depth=0`, {
      method: 'GET',
      credentials: 'include',
    })

    if (res.ok) {
      return
    }

    await wait(delayMs)
  }

  throw new Error('Upload nie został jeszcze zapisany. Spróbuj ponownie za chwilę.')
}

export default function GalleryBulkUpload() {
  const { value: galleryValue, setValue: setGalleryValue } = useField<any[]>({ path: 'gallery' })
  const [files, setFiles] = useState<FileState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep a stable mutable reference to current gallery value during async uploads
  const galleryRef = useRef<any[]>(Array.isArray(galleryValue) ? galleryValue : [])
  useEffect(() => {
    galleryRef.current = Array.isArray(galleryValue) ? galleryValue : []
  }, [galleryValue])

  const uploadFiles = useCallback(
    async (selectedFiles: File[]) => {
      setFiles((prev) => [
        ...prev,
        ...selectedFiles.map((file) => ({ file, status: 'pending' as const })),
      ])

      for (const file of selectedFiles) {
        setFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, status: 'uploading' } : f)),
        )

        try {
          const formData = new FormData()
          formData.append('file', file)

          const res = await fetch('/api/offer-uploads', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err?.errors?.[0]?.message ?? `HTTP ${res.status}`)
          }

          const { doc: uploaded } = await res.json()
          const uploadedId: number = uploaded.id

          // Avoid race condition: make sure upload doc is persisted before
          // referencing it in offer.gallery (prevents FK errors on autosave).
          await waitForUploadDocument(uploadedId)

          const nextGallery = [...galleryRef.current, { image: uploadedId, label: '' }]
          galleryRef.current = nextGallery
          setGalleryValue(nextGallery)

          setFiles((prev) =>
            prev.map((f) => (f.file === file ? { ...f, status: 'done' } : f)),
          )
        } catch (err: any) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, status: 'error', error: err?.message ?? 'Błąd' } : f,
            ),
          )
        }
      }
    },
    [setGalleryValue],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/'),
      )
      if (dropped.length) uploadFiles(dropped)
    },
    [uploadFiles],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? [])
      if (selected.length) uploadFiles(selected)
      // Reset so same files can be re-selected
      e.target.value = ''
    },
    [uploadFiles],
  )

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== file))
  }

  return (
    <div className="flex flex-col gap-3 mb-2">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors px-4 py-6',
          isDragging
            ? 'border-accent bg-accent/10'
            : 'border-(--theme-border-color) hover:border-accent/50 hover:bg-(--theme-elevation-50)',
        )}
      >
        <ImagePlus className="h-7 w-7 text-(--theme-elevation-400)" />
        <p className="text-sm text-(--theme-elevation-500) text-center">
          <span className="font-medium text-(--theme-elevation-700)">Kliknij lub przeciągnij</span>
          {' '}zdjęcia, aby dodać je do galerii
        </p>
        <p className="text-xs text-(--theme-elevation-400)">JPG, PNG, WebP, HEIC</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map(({ file, status, error }) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-center gap-2 rounded-md border border-(--theme-border-color) bg-(--theme-elevation-50) px-3 py-1.5 text-sm"
            >
              {status === 'uploading' && (
                <Upload className="h-4 w-4 shrink-0 animate-pulse text-accent" />
              )}
              {status === 'done' && (
                <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
              {status === 'pending' && (
                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-(--theme-elevation-300)" />
              )}

              <span className="flex-1 truncate text-(--theme-elevation-700)">{file.name}</span>

              {error && (
                <span className="text-xs text-destructive shrink-0">{error}</span>
              )}

              {(status === 'done' || status === 'error') && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); removeFile(file) }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
