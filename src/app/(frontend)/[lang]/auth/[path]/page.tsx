import { AuthView } from '@daveyplate/better-auth-ui'
import { authViewPaths } from '@daveyplate/better-auth-ui/server'

export const dynamicParams = false

// Only generate params for paths NOT handled by explicit route group pages
const EXPLICIT_ROUTES = new Set([
  'sign-in',
  'sign-up',
  'sign-out',
  'forgot-password',
  'reset-password',
])

export function generateStaticParams() {
  return Object.values(authViewPaths)..map((path) => ({ path }))
    .filter((path) => !EXPLICIT_ROUTES.has(path))
    .map((path) => ({ path }))
}

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params

  return (
    <main className="container flex grow flex-col items-center justify-center self-center p-4 md:p-6">
      <AuthView path={path} />
    </main>
  )
}
