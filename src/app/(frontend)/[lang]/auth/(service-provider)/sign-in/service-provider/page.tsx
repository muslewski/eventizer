import { AuthView } from '@daveyplate/better-auth-ui'
import { authClassNames } from '../../../authClassNames'

import type { Config } from '@/payload-types'
import { getDictionary } from '@/lib/dictionary'
type Locale = Config['locale']

export default async function AuthPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <AuthView
      path="sign-in/service-provider"
      view="SIGN_IN"
      redirectTo="/app/onboarding/service-provider"
      socialLayout="horizontal"
      localization={{
        SIGN_UP: dict.auth.signUp,
        SIGN_IN_DESCRIPTION: dict.auth.serviceProviderSignInPage.description,
        SIGN_UP_ACTION: dict.auth.createAccount,
        NAME: dict.auth.name,
        NAME_PLACEHOLDER: dict.auth.name,
        DONT_HAVE_AN_ACCOUNT: dict.auth.dontHaveAnAccount,
        SIGN_IN: dict.auth.signIn,
        OR_CONTINUE_WITH: dict.auth.orContinueWith,
        PASSWORD: dict.auth.password,
        PASSWORD_PLACEHOLDER: dict.auth.password,
        FORGOT_PASSWORD_LINK: dict.auth.forgotPasswordLink,
      }}
      classNames={authClassNames}
    />
  )
}
