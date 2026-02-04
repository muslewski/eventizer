'use client'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation.js'
import React from 'react'

if (!process.env.NEXT_PUBLIC_PAYLOAD_SERVER_URL) {
  console.warn(
    'NEXT_PUBLIC_PAYLOAD_SERVER_URL is not defined. Make sure to set this environment variable to enable live preview functionality.',
  )
}

export const RefreshRouteOnSave: React.FC = () => {
  const router = useRouter()
  return (
    <PayloadLivePreview
      refresh={router.refresh}
      serverURL={process.env.NEXT_PUBLIC_PAYLOAD_SERVER_URL ?? 'http://localhost:3000'}
    />
  )
}
