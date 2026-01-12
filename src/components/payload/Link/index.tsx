import type { Media, Page } from '@/payload-types'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import Image from 'next/image'
import { isExpandedDoc } from '@/lib/isExpandedDoc'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | string | number
  } | null
  size?: ButtonProps['size'] | null
  icon?: Media | number | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    icon,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `${reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''}/${
          reference.value.slug
        }`
      : url

  if (!href) return null

  const size = appearance === 'link' ? undefined : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  if (appearance === 'cta') {
    return (
      <Button
        asChild
        className={cn(className, 'h-fit group/cta-button')}
        size={size ?? undefined}
        variant={appearance}
      >
        <Link className={cn(className)} href={href} {...newTabProps}>
          <div className="flex transition-all duration-300 ease-out items-center gap-2 bg-black/50 group-hover/cta-button:bg-black/70 rounded-full border text-white border-black h-fit w-fit px-4 group-hover:px-5 py-2 backface-hidden">
            {label && label}
            {children && children}
            {icon && isExpandedDoc<Media>(icon) && (
              <div className="bg-[#0B0B0D] group-hover/cta-button:bg-stone-300/85 p-3 rounded-full group-hover:scale-105 transition-all duration-400 ease-out">
                <Image
                  className="invert group-hover/cta-button:rotate-30 group-hover/cta-button:invert-0 transition-[filter, transform] duration-700 ease-in-out"
                  width={20}
                  height={20}
                  src={icon.url || ''}
                  alt={icon.alt || ''}
                />
              </div>
            )}
          </div>
        </Link>
      </Button>
    )
  }

  return (
    <Button
      asChild
      className={cn(className, 'h-fit')}
      size={size ?? undefined}
      variant={appearance}
    >
      <Link className={cn(className)} href={href} {...newTabProps}>
        {label && label}
        {children && children}
        {icon && isExpandedDoc<Media>(icon) && (
          <Image
            className="dark:invert"
            width={20}
            height={20}
            src={icon.url || ''}
            alt={icon.alt || ''}
          />
        )}
      </Link>
    </Button>
  )
}
