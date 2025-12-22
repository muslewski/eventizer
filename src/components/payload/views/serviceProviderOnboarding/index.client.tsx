'use client'

import { CategorySelection } from '@/components/payload/views/serviceProviderOnboarding/categorySelection'
import { Button } from '@/components/ui/button'
import { ServiceCategory, SubscriptionPlan, User } from '@/payload-types'
import { useState } from 'react'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'

interface ServiceProviderOnboardingClientProps {
  categories: ServiceCategory[]
  user: User
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

export function ServiceProviderOnboardingClient({
  categories,
  user,
}: ServiceProviderOnboardingClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isComplete = isCategorySelectionComplete(selectedCategories)
  const requiredPlan = getRequiredPlan(selectedCategories)
  const stripeProductId = requiredPlan ? requiredPlan.stripeID : null

  const handleCategoryChange = (categoryPath: ServiceCategory[]) => {
    setSelectedCategories(categoryPath)
    console.log('Selected category path', categoryPath)
  }

  const handleSubmit = async () => {
    if (!isComplete) return

    setIsSubmitting(true)
    setError(null)

    try {
      const categoryNames = selectedCategories.map((cat) => cat.name)

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
    } catch (error) {
      console.error('Error submitting categories:', error)
      setError('Wystąpił błąd podczas przetwarzania Twojego wyboru. Proszę spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-6 my-16">
      <CategorySelection
        categories={categories}
        value={selectedCategories}
        onSelectionChange={handleCategoryChange}
      />

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {isComplete && (
        <div>
          <Button onClick={handleSubmit} disabled={isSubmitting || !isComplete} size="lg">
            {isSubmitting ? 'Wysyłanie...' : 'Kontynuuj'}
          </Button>
        </div>
      )}
    </div>
  )
}
