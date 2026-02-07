'use client'
import type { ElementType } from 'react'

import React from 'react'
import Link from 'next/link'

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

export const FeatureCard: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, onClick, title, titleAs, count, slug } = props

  const isClickable = onClick || href

  const Tag = titleAs ?? 'div'
  const Icon = slug ? getNavIcon(slug) : undefined

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between gap-4',
        'rounded-lg border border-(--theme-border-color) bg-(--theme-elevation-50)',
        'p-6 transition-all duration-200',
        isClickable &&
          'cursor-pointer hover:bg-(--theme-elevation-100) hover:border-(--theme-elevation-400)',
      )}
      id={id}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-(--theme-elevation-100)">
            <Icon className="w-5 h-5 text-(--theme-elevation-600)" />
          </div>
        )}

        <Tag className="text-sm font-semibold text-(--theme-elevation-650)">{title}</Tag>
      </div>

      {actions && <div className="relative z-10 inline-flex">{actions}</div>}

      {isClickable && (
        <Button
          aria-label={buttonAriaLabel}
          buttonStyle="none"
          className="absolute inset-0 z-1 m-0"
          el="link"
          Link={Link}
          onClick={onClick}
          to={href}
        />
      )}

      <h2 className="text-3xl font-medium m-0 text-(--theme-elevation-800)">{count ?? 0}</h2>
    </div>
  )
}
