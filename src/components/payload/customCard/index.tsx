'use client'

import React from 'react'

import './index.scss'
import { Button } from '@payloadcms/ui'
import { cn } from '@/lib/utils'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: string
  href?: string
  id?: string
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  Link?: React.ElementType
  onClick?: () => void
  title: string
  titleAs?: React.ElementType
}

const baseClass = 'card'

export const CustomCard: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, onClick, title, titleAs } = props

  const isClickable = onClick || href

  const Tag = titleAs ?? 'div'

  return (
    <div
      className={cn(
        baseClass,
        isClickable && `${baseClass}--has-onclick`,
        // Base styling
        'relative overflow-hidden',
        // Golden border effect
        'before:absolute before:inset-0 before:rounded-[inherit] before:p-[1px]',
        'before:bg-gradient-to-br before:from-amber-500/20 before:via-transparent before:to-amber-500/20',
        'before:opacity-0 before:transition-opacity before:duration-300',
        'hover:before:opacity-100 border-2 border-amber-500/10',
        // Subtle golden glow on hover
        'hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)]',
        // Top accent line
        'after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px]',
        'after:bg-gradient-to-r after:from-transparent after:via-amber-500/10 after:to-transparent',
        'after:opacity-0 after:transition-opacity after:duration-300',
        'hover:after:opacity-100',
      )}
      id={id}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
        <div className="absolute top-0 right-0 w-12 h-[1px] bg-gradient-to-l from-amber-500/60 to-transparent transform rotate-45 origin-top-right" />
      </div>

      <Tag
        className={cn(
          `${baseClass}__title`,
          'transition-colors duration-300',
          isClickable && 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
        )}
      >
        {title}
      </Tag>

      {actions && <div className={cn(`${baseClass}__actions`, 'relative z-10')}>{actions}</div>}

      {isClickable && (
        <Button
          aria-label={buttonAriaLabel}
          buttonStyle="none"
          className={`${baseClass}__click`}
          el="link"
          onClick={onClick}
          to={href}
        />
      )}
    </div>
  )
}
