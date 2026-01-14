import { getDictionary } from '@/lib/dictionary'
import { AuthView } from '@daveyplate/better-auth-ui'
import { authViewPaths } from '@daveyplate/better-auth-ui/server'

import type { Config } from '@/payload-types'
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
      path={path}
      view="SIGN_UP"
      redirectTo="/app/onboarding/service-provider"
      socialLayout="horizontal"
      localization={{
        SIGN_UP: dict.auth.signUp,
        SIGN_UP_DESCRIPTION: dict.auth.serviceProviderSignUpPage.description,
        SIGN_UP_ACTION: dict.auth.createAccount,
        NAME: dict.auth.name,
        NAME_PLACEHOLDER: dict.auth.name,
        ALREADY_HAVE_AN_ACCOUNT: dict.auth.alreadyHaveAnAccount,
        SIGN_IN: dict.auth.signIn,
        OR_CONTINUE_WITH: dict.auth.orContinueWith,
        PASSWORD: dict.auth.password,
        PASSWORD_PLACEHOLDER: dict.auth.password,
      }}
      classNames={{
        base: 'bg-gradient-to-br from-white/15 via-stone-200 to-stone-100 dark:from-background dark:via-[#111114] dark:to-background',
        content: 'font-montserrat',
        title: 'xl:text-5xl md:text-4xl sm:text-3xl text-2xl font-bebas font-light',
      }}
    />
  )
}
