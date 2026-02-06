'use client'
import type { ElementType } from 'react'

import React from 'react'
import Link from 'next/link'

import './index.scss'
import { Button } from '@payloadcms/ui'
import { cn } from '@/lib/utils'
import { getNavIcon } from '../../../customNav/navIconMap'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: string
  href?: string
  id?: string
  onClick?: () => void
  title: string
  titleAs?: ElementType
  count?: number
  slug?: string
}

const baseClass = 'feature-card'

export const FeatureCard: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, onClick, title, titleAs, count, slug } = props

  const isClickable = onClick || href

  const Tag = titleAs ?? 'div'
  const Icon = slug ? getNavIcon(slug) : undefined

  return (
    <div
      className={cn(
        baseClass,
        'group',
        isClickable && `${baseClass}--has-onclick`,
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:rounded-[inherit] before:p-[1px]',
        'before:bg-gradient-to-br before:from-accent/20 before:via-transparent before:to-accent/20',
        'before:opacity-0 before:transition-opacity before:duration-300',
        'hover:before:opacity-100 border-2 border-accent/10',
        'hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--accent)_15%,transparent)]',
        'after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px]',
        'after:bg-gradient-to-r after:from-transparent after:via-accent/10 after:to-transparent',
        'after:opacity-0 after:transition-opacity after:duration-300',
        'hover:after:opacity-100 bg-(--theme-elevation-100) dark:bg-(--theme-elevation-50)',
      )}
      id={id}
    >
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
        <div className="absolute top-0 right-0 w-12 h-[1px] bg-gradient-to-l from-accent/60 to-transparent transform rotate-45 origin-top-right" />
      </div>

      <div className="flex items-center gap-4 relative z-[1]">
        {Icon && (
          <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl bg-accent/5 group-hover:bg-accent/10 transition-colors duration-300">
            <Icon
              className={cn(
                'w-7 h-7 transition-all duration-300',
                'text-accent-foreground/70 dark:text-accent/70',
                isClickable &&
                  'group-hover:text-accent dark:group-hover:text-accent group-hover:scale-110',
              )}
            />
          </div>
        )}

        <Tag
          className={cn(
            `${baseClass}__title`,
            'transition-colors duration-300',
            isClickable && 'group-hover:text-accent-foreground dark:group-hover:text-accent',
          )}
        >
          {title}
        </Tag>
      </div>

      {actions && <div className={cn(`${baseClass}__actions`, 'relative z-10')}>{actions}</div>}

      {isClickable && (
        <Button
          aria-label={buttonAriaLabel}
          buttonStyle="none"
          className={`${baseClass}__click`}
          el="link"
          Link={Link}
          onClick={onClick}
          to={href}
        />
      )}

      <h2
        className={cn(
          `${baseClass}__count`,
          'transition-colors duration-300',
          'bg-gradient-to-r from-accent-foreground to-accent bg-clip-text',
          isClickable && 'hover:from-accent hover:to-accent',
        )}
      >
        {count ?? 0}
      </h2>
    </div>
  )
}
