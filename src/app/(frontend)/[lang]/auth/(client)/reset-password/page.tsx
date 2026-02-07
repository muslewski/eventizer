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
      view="RESET_PASSWORD"
      path="reset-password"
      socialLayout="horizontal"
      localization={{
        RESET_PASSWORD: dict.auth.resetPasswordTitle,
        RESET_PASSWORD_DESCRIPTION: dict.auth.resetPasswordDescription,
        NEW_PASSWORD: dict.auth.newPassword,
        NEW_PASSWORD_PLACEHOLDER: dict.auth.newPassword,
        RESET_PASSWORD_ACTION: dict.auth.resetPasswordAction,
        GO_BACK: dict.auth.goBack,
      }}
      classNames={authClassNames}
    />
  )
}
