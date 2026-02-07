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
      path="sign-up"
      view="SIGN_UP"
      socialLayout="horizontal"
      localization={{
        SIGN_UP: dict.auth.signUp,
        SIGN_UP_DESCRIPTION: dict.auth.clientSignUpPage.description,
        SIGN_UP_ACTION: dict.auth.createAccount,
        NAME: dict.auth.name,
        NAME_PLACEHOLDER: dict.auth.name,
        ALREADY_HAVE_AN_ACCOUNT: dict.auth.alreadyHaveAnAccount,
        SIGN_IN: dict.auth.signIn,
        OR_CONTINUE_WITH: dict.auth.orContinueWith,
        PASSWORD: dict.auth.password,
        PASSWORD_PLACEHOLDER: dict.auth.password,
      }}
      classNames={authClassNames}
    />
  )
}
