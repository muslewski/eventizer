'use client'

import { Collapsible } from '@payloadcms/ui'
import React, { FC, ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

import './index.scss'

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
        'nav-group',
        'relative',
        // Subtle separator
        'before:absolute before:bottom-0 before:left-2 before:right-2 before:h-[1px]',
        'before:bg-gradient-to-r before:from-transparent before:via-amber-500/10 before:to-transparent',
        'last:before:hidden',
      )}
      isCollapsed={collapsed}
      collapsibleStyle="default"
      header={
        <div className="nav-group__header group flex items-center gap-2 cursor-pointer py-1">
          {/* Decorative dot */}
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all duration-300',
              collapsed ? 'bg-amber-500/30' : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]',
            )}
          />
          <div
            className={cn(
              'nav-group__label',
              'text-xl tracking-wide uppercase',
              // 'transition-colors duration-200',
              collapsed ? 'text-gray-500 dark:text-gray-500' : 'text-amber-600 dark:text-amber-400',
              'group-hover:text-amber-500 dark:group-hover:text-amber-400',
            )}
            style={{ fontFamily: 'Bebas Neue' }}
          >
            {label}
          </div>
        </div>
      }
      onToggle={handleToggle}
    >
      <div className="nav-group__content pl-2 pt-1 pb-3">{children}</div>
    </Collapsible>
  )
}
