import { AuthView } from '@daveyplate/better-auth-ui'
import { authViewPaths } from '@daveyplate/better-auth-ui/server'
import { authClassNames } from '../../authClassNames'

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
      classNames={authClassNames}
    />
  )
}
