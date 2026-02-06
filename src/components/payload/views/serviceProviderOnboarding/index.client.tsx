'use client'

import { CategorySelection } from '@/components/payload/views/serviceProviderOnboarding/categorySelection'
import { Button } from '@/components/ui/button'
import { ServiceCategory, SubscriptionPlan, User } from '@/payload-types'
import { useState, useEffect } from 'react'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { updateUserServiceCategory } from '@/actions/user/updateUserServiceCategory'
import { updateSubscription } from '@/actions/stripe/updateSubscription'
import { revertToClient } from '@/actions/user/revertToClient'
import { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Info, AlertTriangle, CheckCircle, UserMinus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ServiceProviderOnboardingClientProps {
  categories: ServiceCategory[]
  user: User
  isEditMode?: boolean
  currentSubscription?: CurrentSubscriptionDetails
  initialCategoryPath?: number[]
}

// Helper to check if category selection is complete
function isCategorySelectionComplete(selectedCategories: ServiceCategory[]): boolean {
  if (selectedCategories.length === 0) return false

  const lastCategory = selectedCategories[selectedCategories.length - 1] as any
  const level = selectedCategories.length

  // Check if the last selected category has no more subcategories
  if (level === 1) {
    return !lastCategory.subcategory_level_1?.length
  }
  if (level === 2) {
    return !lastCategory.subcategory_level_2?.length
  }
  if (level >= 3) {
    return true
  }

  return false
}

// Helper to get the required plan from selected categories
function getRequiredPlan(selectedCategories: ServiceCategory[]): SubscriptionPlan | null {
  if (selectedCategories.length === 0) return null

  // Check from the deepest category up to find a required plan
  for (let i = selectedCategories.length - 1; i >= 0; i--) {
    const category = selectedCategories[i]
    if (category.requiredPlan) {
      return category.requiredPlan as SubscriptionPlan
    }
  }

  return null
}

// Helper to find categories by IDs from the nested structure
function findCategoriesByPath(
  categories: ServiceCategory[],
  pathIds: number[],
): ServiceCategory[] | null {
  if (pathIds.length === 0) return null

  const result: ServiceCategory[] = []
  let currentCategories = categories

  for (const id of pathIds) {
    const found = currentCategories.find((cat) => cat.id === id)
    if (!found) return null
    result.push(found)

    // Move to next level
    const foundWithSubs = found as any
    if (foundWithSubs.subcategory_level_1) {
      currentCategories = foundWithSubs.subcategory_level_1
    } else if (foundWithSubs.subcategory_level_2) {
      currentCategories = foundWithSubs.subcategory_level_2
    } else {
      currentCategories = []
    }
  }

  return result
}

type ChangeType = 'upgrade' | 'downgrade' | 'same_plan' | 'category_only' | null

export function ServiceProviderOnboardingClient({
  categories,
  user,
  isEditMode = false,
  currentSubscription,
  initialCategoryPath = [],
}: ServiceProviderOnboardingClientProps) {
  const router = useRouter()
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReverting, setIsReverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check if this is a new service provider (no subscription yet)
  const isNewServiceProvider = !currentSubscription?.hasSubscription

  // Initialize with current category if in edit mode
  useEffect(() => {
    if (isEditMode && initialCategoryPath.length > 0) {
      const initialCategories = findCategoriesByPath(categories, initialCategoryPath)
      if (initialCategories) {
        setSelectedCategories(initialCategories)
      }
    }
  }, [isEditMode, initialCategoryPath, categories])

  const isComplete = isCategorySelectionComplete(selectedCategories)
  const requiredPlan = getRequiredPlan(selectedCategories)
  const stripeProductId = requiredPlan ? requiredPlan.stripeID : null

  // Determine what type of change this is
  const getChangeType = (): ChangeType => {
    if (!isComplete || !isEditMode || !currentSubscription?.hasSubscription) return null

    const currentPlanLevel = currentSubscription.currentPlan?.level ?? 0
    const newPlanLevel = requiredPlan?.level ?? 0

    // Same product = either same plan or just category change
    if (currentSubscription.currentProductId === stripeProductId) {
      return 'category_only'
    }

    if (newPlanLevel > currentPlanLevel) return 'upgrade'
    if (newPlanLevel < currentPlanLevel) return 'downgrade'
    return 'same_plan'
  }

  const changeType = getChangeType()

  const handleCategoryChange = (categoryPath: ServiceCategory[]) => {
    setSelectedCategories(categoryPath)
    setError(null)
    setSuccessMessage(null)
  }

  const handleRevertToClient = async () => {
    setIsReverting(true)
    setError(null)

    try {
      const result = await revertToClient(user.id)

      if (!result.success) {
        throw new Error(result.error || 'Wystąpił błąd')
      }

      // Redirect to the main app after reverting
      router.push('/app')
      router.refresh()
    } catch (err) {
      console.error('Error reverting to client:', err)
      setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd')
    } finally {
      setIsReverting(false)
    }
  }

  const handleSubmit = async () => {
    if (!isComplete) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const categoryNames = selectedCategories.map((cat) => cat.name)
      const categorySlugs = selectedCategories.map((cat) => cat.slug)

      if (isEditMode && currentSubscription?.hasSubscription) {
        // Handle subscription update
        const result = await updateSubscription({
          userId: user.id,
          newProductId: stripeProductId!,
          categoryNames,
          categorySlugs,
        })

        if (!result.success) {
          throw new Error(result.message)
        }

        router.push('/app/account')
        setSuccessMessage(result.message)

        // Redirect after a short delay for upgrades/downgrades
        if (result.action !== 'category_only') {
          setTimeout(() => {
            router.push('/app/account')
          }, 2000)
        }
      } else {
        // New subscription flow (existing logic)
        const updateResult = await updateUserServiceCategory({
          userId: String(user.id),
          categoryNames,
          categorySlugs,
        })

        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to save category')
        }

        const { url } = await createCheckoutSession({
          productId: stripeProductId!,
          userId: user.id,
          successUrl: '/app',
          cancelUrl: '/app/onboarding/service-provider',
          categoryNames,
          userEmail: user.email || undefined,
        })

        if (url) {
          window.location.href = url
        }
      }
    } catch (error) {
      console.error('Error submitting categories:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Wystąpił błąd podczas przetwarzania Twojego wyboru. Proszę spróbuj ponownie.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSubmitButtonText = () => {
    if (isSubmitting) return 'Przetwarzanie...'
    if (!isEditMode) return 'Kontynuuj'

    switch (changeType) {
      case 'upgrade':
        return 'Ulepsz plan'
      case 'downgrade':
        return 'Zmień na niższy plan'
      case 'category_only':
        return 'Zapisz kategorię'
      default:
        return 'Zapisz zmiany'
    }
  }

  const getChangeAlert = () => {
    if (!isComplete || !isEditMode) return null

    switch (changeType) {
      case 'upgrade':
        return (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle>Ulepszenie planu</AlertTitle>
            <AlertDescription>
              Przechodzisz na wyższy plan. Zostaniesz obciążony proporcjonalną różnicą w cenie.
            </AlertDescription>
          </Alert>
        )
      case 'downgrade':
        return (
          <Alert className="border-accent/50 bg-accent/10">
            <AlertTriangle className="h-4 w-4 text-accent-foreground" />
            <AlertTitle>Obniżenie planu</AlertTitle>
            <AlertDescription>
              Przechodzisz na niższy plan. Zmiana wejdzie w życie na koniec bieżącego okresu
              rozliczeniowego.
            </AlertDescription>
          </Alert>
        )
      case 'category_only':
        return (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Zmiana kategorii</AlertTitle>
            <AlertDescription>
              Twój plan pozostaje bez zmian. Aktualizujesz tylko kategorię usług.
            </AlertDescription>
          </Alert>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6 my-16">
      {isEditMode && (
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót
        </Button>
      )}

      {isEditMode && currentSubscription?.currentPlan && (
        <Alert className="border-[var(--theme-elevation-200)]">
          <Info className="h-4 w-4" />
          <AlertTitle>Aktualny plan: {currentSubscription.currentPlan.name}</AlertTitle>
          <AlertDescription>
            {user.serviceCategory && `Kategoria: ${user.serviceCategory}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Show revert option only for new service providers without subscription */}
      {isNewServiceProvider && (
        <Alert className="border-[var(--theme-elevation-200)]">
          <Info className="h-4 w-4" />
          <AlertTitle>Zmiana zdania?</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Możesz wrócić do konta klienta w dowolnym momencie.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevertToClient}
              disabled={isReverting}
              className="ml-4"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              {isReverting ? 'Przetwarzanie...' : 'Wróć do klienta'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <CategorySelection
        categories={categories}
        value={selectedCategories}
        onSelectionChange={handleCategoryChange}
      />

      {getChangeAlert()}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {isComplete && (
        <div className="flex gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isComplete}
            size="lg"
            className={cn(
              changeType === 'upgrade' && 'bg-blue-600 hover:bg-blue-700',
              changeType === 'downgrade' && 'bg-accent hover:bg-accent-foreground',
            )}
          >
            {getSubmitButtonText()}
          </Button>

          {isEditMode && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
