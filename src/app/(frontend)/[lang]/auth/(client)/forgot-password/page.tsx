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
      view="FORGOT_PASSWORD"
      path={path}
      socialLayout="horizontal"
      localization={{
        FORGOT_PASSWORD: dict.auth.forgotPasswordTitle,
        FORGOT_PASSWORD_DESCRIPTION: dict.auth.forgotPasswordDescription,
        FORGOT_PASSWORD_ACTION: dict.auth.forgotPasswordAction,
        OR_CONTINUE_WITH: dict.auth.orContinueWith,
        GO_BACK: dict.auth.goBack,
      }}
      classNames={{
        base: 'bg-gradient-to-br from-white/15 via-stone-200 to-stone-100 dark:from-background dark:via-[#111114] dark:to-background',
        content: 'font-montserrat',
        title: 'xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas font-light',
      }}
    />
  )
}
