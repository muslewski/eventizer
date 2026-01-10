import { AuthView } from '@daveyplate/better-auth-ui'
import { authViewPaths } from '@daveyplate/better-auth-ui/server'

import type { Config } from '@/payload-types'
import { getDictionary } from '@/lib/dictionary'
type Locale = Config['locale']

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({
    path,
  }))
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string; lang: Locale }>
}) {
  const { path, lang } = await params
  const dict = await getDictionary(lang)

  return (
    <AuthView
      view="RESET_PASSWORD"
      path={path}
      socialLayout="horizontal"
      localization={{
        RESET_PASSWORD: dict.auth.resetPasswordTitle,
        RESET_PASSWORD_DESCRIPTION: dict.auth.resetPasswordDescription,
        NEW_PASSWORD: dict.auth.newPassword,
        NEW_PASSWORD_PLACEHOLDER: dict.auth.newPassword,
        RESET_PASSWORD_ACTION: dict.auth.resetPasswordAction,
        GO_BACK: dict.auth.goBack,
      }}
      classNames={{
        base: 'bg-gradient-to-br from-white/15 via-stone-200 to-stone-100 dark:from-[#0B0B0D] dark:via-[#111114] dark:to-[#0B0B0D]',
        content: 'font-montserrat',
        title: 'xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas font-light',
      }}
    />
  )
}
