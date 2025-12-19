'use client'

import Image from 'next/image'
import { useAuth, useTranslation } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'dashboard-banner'

import dashboardBanner from '@/assets/dashboard-banner.jpeg'
import {
  CustomTranslationsKeys,
  CustomTranslationsObject,
} from '@/translations/custom-translations'
import type { User } from '@/payload-types'

export const DashboardBanner = () => {
  const { t } = useTranslation<CustomTranslationsObject, CustomTranslationsKeys>()
  const { user } = useAuth<User>()

  // Map roles to translation keys
  const getSubtitleKey = (): CustomTranslationsKeys => {
    switch (user?.role) {
      case 'admin':
        return 'dashboard:welcomeSubtitleAdmin'
      case 'moderator':
        return 'dashboard:welcomeSubtitleModerator'
      case 'service-provider':
        return 'dashboard:welcomeSubtitleServiceProvider'
      case 'client':
        return 'dashboard:welcomeSubtitleClient'
      default:
        return 'dashboard:welcomeSubtitleClient' // Fallback
    }
  }

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__image-wrap`}>
          <Image src={dashboardBanner} className="object-cover" alt="" fill />
          {/* Elegant overlay with golden tint */}
          <div className="absolute inset-0 z-10 bg-black/30" />
          <div className="absolute inset-0 z-15 bg-gradient-to-r from-amber-900/40 via-transparent to-amber-900/40" />
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-[var(--color-base-50)]/20 dark:to-[var(--color-base-900)]" />
        </div>

        {/* Golden accent line */}
        <div className="absolute bottom-0 left-0 right-0 z-25 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80" />

        <div className="absolute bottom-0 left-0 right-0 z-30 px-12 pb-8">
          {/* Decorative golden element */}
          <div className="flex items-center gap-4 mb-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500" />
            <span className="text-amber-500 text-xs font-semibold uppercase tracking-[0.3em]">
              Eventizer
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500" />
          </div>

          <h1
            className="text-6xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-lg"
            style={{ fontFamily: 'Bebas Neue' }}
          >
            {t('dashboard:welcomeTitle')}
          </h1>

          <p className="text-white/90 mt-2 text-lg font-light tracking-wide drop-shadow">
            {t(getSubtitleKey())}
          </p>

          {/* Bottom decorative accent */}
          <div className="mt-4 h-0.5 w-24 bg-gradient-to-r from-amber-500 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  )
}
