'use client'

import { useState, useEffect } from 'react'

export function useStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)
  }, [])

  return isStandalone
}
