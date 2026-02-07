import { AuthView } from '@daveyplate/better-auth-ui'
import { authClassNames } from '../../authClassNames'

export default async function AuthPage() {
  return (
    <AuthView
      path="sign-out"
      view="SIGN_OUT"
      socialLayout="horizontal"
      classNames={authClassNames}
    />
  )
}
