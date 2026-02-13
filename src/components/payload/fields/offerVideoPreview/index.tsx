'use client'

import { useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

/**
 * Admin UI component that renders an inline video preview below the video upload field.
 * Reads the sibling `video` field value and resolves the video URL to display.
 */
export default function OfferVideoPreview() {
  const videoField = useFormFields(([fields]) => fields['video'])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function resolveUrl() {
      const val = videoField?.value

      if (!val) {
        setVideoUrl(null)
        return
      }

      // If the value is an expanded doc object with a url
      if (typeof val === 'object' && val !== null && 'url' in val) {
        setVideoUrl((val as { url?: string }).url ?? null)
        return
      }

      // If it's an ID, fetch the upload to get the url
      if (typeof val === 'number' || typeof val === 'string') {
        try {
          const res = await fetch(`/api/offer-video-uploads/${val}?depth=0`)
          if (res.ok) {
            const data = await res.json()
            setVideoUrl(data?.url ?? null)
          } else {
            setVideoUrl(null)
          }
        } catch {
          setVideoUrl(null)
        }
        return
      }

      setVideoUrl(null)
    }

    resolveUrl()
  }, [videoField?.value])

  if (!videoUrl) return null

  return (
    <div
      style={{
        marginTop: '1rem',
        marginBottom: '1.5rem',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div
        style={{
          padding: '0.5rem 1rem',
          borderBottom: '1px solid var(--theme-elevation-150)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--theme-elevation-800)',
        }}
      >
        Video Preview
      </div>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
        <video
          src={videoUrl}
          controls
          preload="metadata"
          style={{
            maxWidth: '100%',
            maxHeight: '400px',
            borderRadius: '6px',
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}
