'use client'

import { getTranslation } from '@payloadcms/translations'
import { useConfig, useTranslation } from '@payloadcms/ui'
import { baseClass } from './index'
import { EntityType, formatAdminURL, NavGroupType } from '@payloadcms/ui/shared'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FC, Fragment, useCallback, useState, useEffect } from 'react'
import { getNavIcon } from './navIconMap'
import { motion } from 'framer-motion'
import { CustomNavGroup } from './CustomNavGroup'

type Props = {
  groups: NavGroupType[]
}

const NAV_PREFS_KEY = 'eventizer-nav-preferences'

export const NavClient: FC<Props> = ({ groups }) => {
  const pathname = usePathname()
  const [navPreferences, setNavPreferences] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(NAV_PREFS_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  useEffect(() => {
    localStorage.setItem(NAV_PREFS_KEY, JSON.stringify(navPreferences))
  }, [navPreferences])

  const handleGroupToggle = useCallback((groupLabel: string, isOpen: boolean) => {
    setNavPreferences((prev) => ({
      ...prev,
      [groupLabel]: isOpen,
    }))
  }, [])

  return (
    <Fragment>
      {groups.map(({ entities, label }, key) => {
        const isOpen = navPreferences[label] ?? true

        return (
          <CustomNavGroup
            isOpen={isOpen}
            key={key}
            label={label}
            onToggle={(newOpen) => handleGroupToggle(label, newOpen)}
          >
            {entities.map(({ slug, type, label }, i) => {
              const href =
                type === EntityType.collection
                  ? formatAdminURL({ adminRoute, path: `/collections/${slug}` })
                  : formatAdminURL({ adminRoute, path: `/globals/${slug}` })

              const id = type === EntityType.collection ? `nav-${slug}` : `nav-global-${slug}`

              const activeCollection =
                pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

              const Icon = getNavIcon(slug)

              return (
                <Link
                  className={[`${baseClass}__link flex gap-3`, activeCollection && `active`]
                    .filter(Boolean)
                    .join(' ')}
                  href={href}
                  id={id}
                  key={i}
                  prefetch={false}
                >
                  {activeCollection && (
                    <motion.div
                      layoutId="activeIndicator"
                      className={`${baseClass}__link-indicator absolute  -left-4 top-1/2 -translate-y-1/2`}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {Icon && (
                    <Icon
                      className={`${baseClass}__icon text-yellow-600/50 dark:text-amber-100/80`}
                    />
                  )}
                  <span className={`${baseClass}__link-label`}>{getTranslation(label, i18n)}</span>
                </Link>
              )
            })}
          </CustomNavGroup>
        )
      })}
    </Fragment>
  )
}
