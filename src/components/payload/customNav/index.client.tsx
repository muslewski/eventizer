'use client'

import { getTranslation } from '@payloadcms/translations'
import { useConfig, useTranslation } from '@payloadcms/ui'
import { EntityType, formatAdminURL, NavGroupType } from '@payloadcms/ui/shared'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FC, useCallback, useState, useEffect, useMemo, useRef } from 'react'
import { getNavIcon } from './navIconMap'
import { motion } from 'framer-motion'
import { CustomNavGroup } from './CustomNavGroup'
import { cn } from '@/lib/utils'

type Props = {
  groups: NavGroupType[]
}

const NAV_PREFS_KEY = 'eventizer-nav-preferences'

// Module-level flag - survives re-renders but resets on page reload
let hasAnimatedOnce = false

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const groupVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -16, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
}

export const NavClient: FC<Props> = ({ groups }) => {
  const pathname = usePathname()
  const [navPreferences, setNavPreferences] = useState<Record<string, boolean> | null>(null)
  const [shouldAnimate] = useState(() => !hasAnimatedOnce)
  const prevPathnameRef = useRef<string | null>(null)

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  // Find which group contains the active link
  const activeGroupLabel = useMemo(() => {
    for (const { entities, label } of groups) {
      for (const { slug, type } of entities) {
        const href =
          type === EntityType.collection
            ? formatAdminURL({ adminRoute, path: `/collections/${slug}` })
            : formatAdminURL({ adminRoute, path: `/globals/${slug}` })

        const isActive =
          pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

        if (isActive) {
          return label
        }
      }
    }
    return null
  }, [groups, pathname, adminRoute])

  // Mark as animated after first render
  useEffect(() => {
    if (!hasAnimatedOnce) {
      hasAnimatedOnce = true
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAV_PREFS_KEY)
      if (stored) {
        setNavPreferences(JSON.parse(stored))
      } else {
        setNavPreferences({})
      }
    } catch {
      setNavPreferences({})
    }
  }, [])

  useEffect(() => {
    if (navPreferences !== null) {
      localStorage.setItem(NAV_PREFS_KEY, JSON.stringify(navPreferences))
    }
  }, [navPreferences])

  // Auto-open group containing active link only when pathname changes
  useEffect(() => {
    if (navPreferences === null || activeGroupLabel === null) return

    const isFirstCheck = prevPathnameRef.current === null
    const pathnameChanged = prevPathnameRef.current !== pathname
    prevPathnameRef.current = pathname

    // Auto-open on initial load OR when navigating to a new path
    if (isFirstCheck || pathnameChanged) {
      const isGroupClosed = navPreferences[activeGroupLabel] === false
      if (isGroupClosed) {
        setNavPreferences((prev) => ({
          ...prev,
          [activeGroupLabel]: true,
        }))
      }
    }
  }, [pathname, activeGroupLabel, navPreferences])

  const handleGroupToggle = useCallback((groupLabel: string, isOpen: boolean) => {
    setNavPreferences((prev) => ({
      ...prev,
      [groupLabel]: isOpen,
    }))
  }, [])

  // Don't render until hydrated to prevent mismatch
  if (navPreferences === null) {
    return null
  }

  return (
    <motion.div
      className="w-full flex-1 min-h-0 overflow-y-auto"
      variants={containerVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate="visible"
    >
      {groups.map(({ entities, label }, key) => {
        const isOpen = navPreferences[label] ?? true

        return (
          <motion.div
            variants={groupVariants}
            initial={shouldAnimate ? undefined : false}
            key={key}
          >
            <CustomNavGroup
              isOpen={isOpen}
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
                    className={cn(
                      'group relative flex items-center gap-2 px-2 py-1.5 rounded-md',
                      'no-underline transition-colors duration-150',
                      'hover:bg-accent/10',
                      activeCollection && 'bg-accent/10',
                    )}
                    href={href}
                    id={id}
                    key={i}
                    prefetch={false}
                  >
                    <motion.div
                      variants={itemVariants}
                      initial={shouldAnimate ? undefined : false}
                      className="flex items-center gap-2 min-w-0"
                    >
                      {activeCollection && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-accent"
                        />
                      )}

                      {Icon && (
                        <Icon
                          className={cn(
                            'size-4 shrink-0 transition-colors duration-150',
                            activeCollection
                              ? 'text-accent'
                              : 'text-muted-foreground group-hover:text-accent/70',
                          )}
                        />
                      )}

                      <span
                        className={cn(
                          'text-sm truncate',
                          activeCollection
                            ? 'text-accent-foreground dark:text-accent font-medium'
                            : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      >
                        {getTranslation(label, i18n)}
                      </span>
                    </motion.div>
                  </Link>
                )
              })}
            </CustomNavGroup>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
