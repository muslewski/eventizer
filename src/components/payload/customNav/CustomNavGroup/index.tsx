'use client'

import { Collapsible } from '@payloadcms/ui'
import React, { FC, ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  isOpen: boolean
  label: string
  onToggle: (isOpen: boolean) => void
}

export const CustomNavGroup: FC<Props> = ({ children, isOpen = true, label, onToggle }) => {
  const [collapsed, setCollapsed] = useState(!isOpen)

  // Update collapsed state when isOpen prop changes
  useEffect(() => {
    setCollapsed(!isOpen)
  }, [isOpen])

  const handleToggle = (newCollapsed: boolean) => {
    setCollapsed(newCollapsed)
    onToggle(!newCollapsed)
  }

  return (
    <Collapsible
      className={cn(
        'nav-group mb-2 relative',
        '[&_.collapsible__toggle-wrap]:p-1',
        '[&_.collapsible__toggle-wrap_span]:hidden',
        '[&_.collapsible__toggle]:text-accent/60 [&_.collapsible__toggle]:transition-colors',
        'hover:[&_.collapsible__toggle]:text-accent',
      )}
      isCollapsed={collapsed}
      collapsibleStyle="default"
      header={
        <div className="group flex items-center gap-1.5 cursor-pointer px-1 py-0.5 rounded-md transition-colors hover:bg-accent/5">
          {/* Decorative dot */}
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300',
              collapsed
                ? 'bg-accent/30'
                : 'bg-accent shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_50%,transparent)]',
            )}
          />
          <span
            className={cn(
              'text-xs font-semibold tracking-wider uppercase truncate',
              collapsed ? 'text-muted-foreground' : 'text-accent-foreground dark:text-accent',
              'group-hover:text-accent dark:group-hover:text-accent',
            )}
          >
            {label}
          </span>
        </div>
      }
      onToggle={handleToggle}
    >
      <div className="pl-1 pt-0.5 pb-1">{children}</div>
    </Collapsible>
  )
}
