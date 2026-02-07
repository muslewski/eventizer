'use client'

import React from 'react'

import { Button } from '@payloadcms/ui'
import { cn } from '@/lib/utils'
import { getNavIcon } from '../customNav/navIconMap'

export type Props = {
  actions?: React.ReactNode
  buttonAriaLabel?: string
  href?: string
  id?: string
  onClick?: () => void
  title: string
  titleAs?: React.ElementType
  slug?: string
}

export const CustomCard: React.FC<Props> = (props) => {
  const { id, actions, buttonAriaLabel, href, onClick, title, titleAs, slug } = props

  const isClickable = onClick || href

  const Tag = titleAs ?? 'div'
  const Icon = slug ? getNavIcon(slug) : undefined

  return (
    <div
      className={cn(
        'group relative flex items-center gap-3',
        'rounded-md border border-(--theme-border-color) bg-(--theme-elevation-50)',
        'px-4 py-3 transition-all duration-150',
        isClickable &&
          'cursor-pointer hover:bg-(--theme-elevation-100) hover:border-(--theme-elevation-400)',
      )}
      id={id}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 text-(--theme-elevation-500)" />}

      <Tag className="text-sm font-medium text-(--theme-elevation-650)">{title}</Tag>

      {actions && <div className="relative z-10 inline-flex ml-auto">{actions}</div>}

      {isClickable && (
        <Button
          aria-label={buttonAriaLabel}
          buttonStyle="none"
          className="absolute inset-0 z-1 m-0"
          el="link"
          onClick={onClick}
          to={href}
        />
      )}
    </div>
  )
}
