'use client'

import { Button } from '@/components/ui/button'
import { Zap, ZapOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function ReduceMotionToggle() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check localStorage first, then fall back to system preference
    const stored = localStorage.getItem('reduce-motion')
    if (stored !== null) {
      setReducedMotion(stored === 'true')
      document.documentElement.classList.toggle('reduce-motion', stored === 'true')
    } else {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReducedMotion(mediaQuery.matches)
      document.documentElement.classList.toggle('reduce-motion', mediaQuery.matches)
    }
  }, [])

  const toggleMotion = () => {
    const newValue = !reducedMotion
    setReducedMotion(newValue)
    localStorage.setItem('reduce-motion', String(newValue))
    document.documentElement.classList.toggle('reduce-motion', newValue)
  }

  if (!mounted) {
    return (
      <Button variant="blend" size="icon" disabled>
        <Zap className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle reduced motion</span>
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="blend" size="icon" onClick={toggleMotion}>
            {reducedMotion ? (
              <ZapOff className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Zap className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">{reducedMotion ? 'Enable animations' : 'Reduce motion'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{reducedMotion ? 'Wyłącz redukcję ruchu' : 'Włącz redukcję ruchu'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
