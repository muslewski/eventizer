'use client'

import Image from 'next/image'

import './index.scss'

const baseClass = 'dashboard-banner'

import dashboardBanner from '@/assets/dashboard-banner.jpeg'
import { useTranslation } from '@payloadcms/ui'
import {
  CustomTranslationsKeys,
  CustomTranslationsObject,
} from '@/translations/custom-translations'

export const DashboardBanner = () => {
  const { t } = useTranslation<CustomTranslationsObject, CustomTranslationsKeys>()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrap`}>
        <div className={`${baseClass}__image-wrap`}>
          <Image src={dashboardBanner} className="object-cover" alt="" fill />
          <div className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-transparent to-[var(--color-base-50)] dark:to-[var(--color-base-900)]" />
        </div>
        <div className="absolute bottom-0 left-12 right-0 z-30 px-8 pb-6">
          <h1 className="text-3xl font-bold text-yellow-500 dark:text-white drop-shadow-lg">
            {t('dashboard:welcomeTitle')}
          </h1>
          <p className="text-black  dark:text-white/80 mt-1 drop-shadow">
            {t('dashboard:welcomeSubtitle')}
          </p>
        </div>
      </div>
    </div>
  )
}
