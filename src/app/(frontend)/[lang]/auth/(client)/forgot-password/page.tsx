import { AuthView } from '@daveyplate/better-auth-ui'
import { authClassNames } from '../../authClassNames'

import type { Config } from '@/payload-types'
import { getDictionary } from '@/lib/dictionary'
type Locale = Config['locale']

export default async function AuthPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <AuthView
      view="FORGOT_PASSWORD"
      path="forgot-password"
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
