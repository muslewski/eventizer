import { AuthView } from '@daveyplate/better-auth-ui'
import { authViewPaths } from '@daveyplate/better-auth-ui/server'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }))
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params

  return (
    <main className="container bg-green-500 flex grow flex-col items-center justify-center self-center p-4 md:p-6">
      <div>Here you create client account</div>
      <AuthView path={path} view="SIGN_UP" />
    </main>
  )
}
