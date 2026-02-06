'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Briefcase, ArrowRight } from 'lucide-react'
import { useDocumentInfo, useAuth } from '@payloadcms/ui'
import { useState } from 'react'
import { becomeServiceProvider } from '@/actions/user/becomeServiceProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function BecomeServiceProviderField() {
  const router = useRouter()
  const { id } = useDocumentInfo()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only show for the current user viewing their own profile
  const isOwnProfile = user?.id === id

  if (!isOwnProfile) {
    return null
  }

  // Don't show if user is already a service provider or higher
  if (user?.role !== 'client') {
    return null
  }

  const handleBecomeServiceProvider = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await becomeServiceProvider(Number(user.id))

      if (!result.success) {
        throw new Error(result.error || 'Wystąpił błąd')
      }

      // Redirect to onboarding
      router.push('/app/onboarding/service-provider')
    } catch (err) {
      console.error('Error becoming service provider:', err)
      setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-lg max-w-3xl border-2 border-dashed border-accent/30 bg-accent/5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-accent/20 border border-accent/30">
            <Briefcase className="w-6 h-6 text-accent-foreground dark:text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl  text-[var(--theme-text)]">Zostań usługodawcą</h3>
            <p className="text-sm text-[var(--theme-elevation-600)] mt-1 mb-4">
              Chcesz oferować swoje usługi na naszej platformie? Przejdź proces onboardingu i
              wybierz kategorię usług, które chcesz świadczyć.
            </p>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleBecomeServiceProvider}
              disabled={isLoading}
              className="bg-accent-foreground hover:bg-accent-foreground/90 text-white"
            >
              {isLoading ? (
                'Przetwarzanie...'
              ) : (
                <>
                  Rozpocznij
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
