'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { Config } from '@/payload-types'

type Locale = Config['locale']

export async function switchLocaleAction(locale: Locale, currentPath: string) {
  const cookieStore = await cookies()

  if (locale === 'pl') {
    cookieStore.delete('NEXT_LOCALE')
  } else {
    cookieStore.set('NEXT_LOCALE', 'en', { maxAge: 31536000 })
  }

  const pathnameWithoutLocale = currentPath.replace(/^\/(?:en|pl)/, '') || '/'
  const newPath = locale === 'en' ? `/en${pathnameWithoutLocale}` : pathnameWithoutLocale

  redirect(newPath)
}
