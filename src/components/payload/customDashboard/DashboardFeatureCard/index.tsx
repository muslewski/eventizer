'use client'
import type { ElementType } from 'react'

import React from 'react'

import './index.scss'
import { Button } from '@payloadcms/ui'
import { cn } from '@/lib/utils'
import { getNavIcon } from '../../customNav/navIconMap'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: string
  href?: string
  id?: string
  Link?: ElementType
  onClick?: () => void
  title: string
  titleAs?: ElementType
  count?: number
  slug?: string
}

const baseClass = 'feature-card'

export const FeatureCard: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, Link, onClick, title, titleAs, count, slug } = props

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
        'before:bg-gradient-to-br before:from-amber-500/20 before:via-transparent before:to-amber-500/20',
        'before:opacity-0 before:transition-opacity before:duration-300',
        'hover:before:opacity-100 border-2 border-amber-500/10',
        'hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)]',
        'after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px]',
        'after:bg-gradient-to-r after:from-transparent after:via-amber-500/10 after:to-transparent',
        'after:opacity-0 after:transition-opacity after:duration-300',
        'hover:after:opacity-100',
      )}
      id={id}
    >
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
        <div className="absolute top-0 right-0 w-12 h-[1px] bg-gradient-to-l from-amber-500/60 to-transparent transform rotate-45 origin-top-right" />
      </div>

      <div className="flex items-center gap-4 relative z-[1]">
        {Icon && (
          <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-xl bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors duration-300">
            <Icon
              className={cn(
                'w-7 h-7 transition-all duration-300',
                'text-amber-600/70 dark:text-amber-400/70',
                isClickable &&
                  'group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:scale-110',
              )}
            />
          </div>
        )}

        <Tag
          className={cn(
            `${baseClass}__title`,
            'transition-colors duration-300',
            isClickable && 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
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
          'bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text',
          isClickable && 'hover:from-amber-500 hover:to-amber-400',
        )}
      >
        {count ?? 0}
      </h2>
    </div>
  )
}
