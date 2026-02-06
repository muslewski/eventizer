'use client'
import { useNav } from '@payloadcms/ui'
import React from 'react'

export const NavWrapper: React.FC<{
  baseClass?: string
  children: React.ReactNode
}> = (props) => {
  const { baseClass, children } = props

  const { hydrated, navOpen, navRef, shouldAnimate } = useNav()

  return (
    <aside
      className={[
        baseClass,
        // 'bg-linear-to-b from-base-100/50 to-base-50 dark:from-base-850/50 dark:to-base-950',
        'bg-base-0 dark:bg-base-950 border-r border-border/50',
        navOpen && `${baseClass}--nav-open`,
        shouldAnimate && `${baseClass}--nav-animate`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
      inert={!navOpen ? true : undefined}
    >
      <div className={`${baseClass}__scroll !overflow-hidden`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
