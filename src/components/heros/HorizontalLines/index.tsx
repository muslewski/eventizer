'use client'

import React from 'react'

type GradientDirection = 'to-b' | 'to-t'
type Breakpoint = 'always' | 'sm' | 'md' | 'xl'

export interface LineConfig {
  direction: GradientDirection
  from: number
  via?: number
  to?: number
  blur?: boolean
  show: Breakpoint
}

interface HorizontalLinesProps {
  lines: LineConfig[]
}

const breakpointClasses: Record<Breakpoint, string> = {
  always: 'flex',
  sm: 'hidden sm:flex',
  md: 'hidden md:flex',
  xl: 'hidden xl:flex',
}

function buildGradient(config: LineConfig, isDark: boolean): string {
  const dir = config.direction === 'to-b' ? 'to bottom' : 'to top'
  const baseColor = isDark ? '0,0,0' : '255,255,255'
  const fromColor = `rgba(${baseColor},${config.from / 100})`
  const viaColor = config.via !== undefined ? `rgba(${baseColor},${config.via / 100})` : null
  const toColor = config.to !== undefined ? `rgba(${baseColor},${config.to / 100})` : 'transparent'

  if (viaColor !== null) {
    return `linear-gradient(${dir}, ${fromColor}, ${viaColor}, ${toColor})`
  }
  return `linear-gradient(${dir}, ${fromColor}, ${toColor})`
}

export const HorizontalLines: React.FC<HorizontalLinesProps> = ({ lines }) => {
  return (
    <div className="absolute inset-0 flex items-end justify-between pointer-events-none">
      {lines.map((line, index) => (
        <div
          key={index}
          className={`h-[calc(100%-58px)]  w-full justify-end ${breakpointClasses[line.show]}`}
          style={{
            backdropFilter: line.blur ? 'blur(4px)' : undefined,
            WebkitBackdropFilter: line.blur ? 'blur(4px)' : undefined,
          }}
        >
          {/* Light theme line */}
          <div
            className="h-full w-0.5 dark:hidden opacity-50"
            style={{ background: buildGradient(line, false) }}
          />
          {/* Dark theme line */}
          <div
            className="h-full w-0.5 hidden dark:block opacity-75"
            style={{ background: buildGradient(line, true) }}
          />
        </div>
      ))}
    </div>
  )
}
