'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { auth } from '@/auth/auth'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import type { Media, ServiceCategory, SubscriptionPlan } from '@/payload-types'

export interface CategoryOption {
  slug: string
  name: string
  fullPath: string
  fullName: string
  requiredPlanLevel: number
  requiredPlanName: string
  depth: number
  isAvailable: boolean
  isUserDefault: boolean
  iconUrl: string | null
  children: CategoryOption[]
}

export interface UserPlanInfo {
  currentPlanLevel: number
  currentPlanName: string
  userDefaultCategory: string | null
}

export interface GetOfferCategoriesResult {
  categories: CategoryOption[]
  userPlanInfo: UserPlanInfo | null
  error?: string
}

interface SubcategoryItem {
  name: string
  slug: string
  requiredPlan?: string | SubscriptionPlan | null
  icon?: number | Media | null
  description?: string | null
  subcategory_level_1?: SubcategoryItem[] | null
  subcategory_level_2?: SubcategoryItem[] | null
  id?: string | null
}

// Helper to get user's subscription plan level from Stripe
async function getUserPlanLevel(userId: number): Promise<{ level: number; name: string }> {
  try {
    // Get the current subscription details from Stripe
    const subscriptionDetails = await getCurrentSubscriptionDetails(userId)

    // Check if user has an active subscription
    if (subscriptionDetails.hasSubscription && subscriptionDetails.currentPlan) {
      return {
        level: subscriptionDetails.currentPlan.level,
        name: subscriptionDetails.currentPlan.name,
      }
    }

    // No active subscription
    return { level: 0, name: 'No Plan' }
  } catch (error) {
    console.error('Error fetching user plan level:', error)
    return { level: 0, name: 'No Plan' }
  }
}

// Build a nested tree structure for categories
function buildCategoryTree(
  categories: ServiceCategory[],
  userPlanLevel: number,
  userDefaultCategorySlug: string | null,
): CategoryOption[] {
  const processCategory = (
    category: SubcategoryItem & { requiredPlan?: string | SubscriptionPlan | null },
    parentPath: string = '',
    parentName: string = '',
    depth: number = 0,
  ): CategoryOption => {
    const fullPath = parentPath ? `${parentPath}/${category.slug}` : category.slug
    const fullName = parentName ? `${parentName} → ${category.name}` : category.name

    // Get the required plan level for this specific category (not inherited from parent)
    let requiredPlanLevel = 0
    let requiredPlanName = 'No Plan Required'

    if (category.requiredPlan) {
      const plan = category.requiredPlan as SubscriptionPlan
      if (typeof plan === 'object' && plan.level !== undefined) {
        requiredPlanLevel = plan.level
        requiredPlanName = plan.name || 'Premium'
      }
    }

    // Extract icon URL if available
    let iconUrl: string | null = null
    if (category.icon && typeof category.icon === 'object' && 'url' in category.icon) {
      iconUrl = category.icon.url || null
    }

    // User can access if their plan level is >= required level
    const isAvailable = userPlanLevel >= requiredPlanLevel
    const isUserDefault = fullPath === userDefaultCategorySlug

    // Process children (subcategories)
    const children: CategoryOption[] = []

    // Process subcategories level 1
    if (category.subcategory_level_1 && Array.isArray(category.subcategory_level_1)) {
      for (const subcat of category.subcategory_level_1) {
        children.push(processCategory(subcat, fullPath, fullName, depth + 1))
      }
    }

    // Process subcategories level 2
    if (category.subcategory_level_2 && Array.isArray(category.subcategory_level_2)) {
      for (const subcat of category.subcategory_level_2) {
        children.push(processCategory(subcat, fullPath, fullName, depth + 1))
      }
    }

    return {
      slug: category.slug,
      name: category.name,
      fullPath,
      fullName,
      requiredPlanLevel,
      requiredPlanName,
      depth,
      isAvailable,
      isUserDefault,
      iconUrl,
      children,
    }
  }

  const tree: CategoryOption[] = []

  for (const category of categories) {
    tree.push(processCategory(category as unknown as SubcategoryItem, '', '', 0))
  }

  return tree
}

// Flatten tree for simple iteration while keeping tree info
function flattenTree(tree: CategoryOption[]): CategoryOption[] {
  const result: CategoryOption[] = []

  const flatten = (categories: CategoryOption[]) => {
    for (const cat of categories) {
      result.push(cat)
      if (cat.children.length > 0) {
        flatten(cat.children)
      }
    }
  }

  flatten(tree)
  return result
}

export async function getOfferCategories(): Promise<GetOfferCategoriesResult> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Get current user session
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return { categories: [], userPlanInfo: null, error: 'Unauthorized' }
    }

    const userId = session.user.id

    // Fetch user data including their default service category
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
    })

    // Safely access serviceCategorySlug
    const userDefaultCategory = user.serviceCategorySlug || null

    // Get user's subscription plan level from Stripe (pass numeric userId)
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId
    const userPlan = await getUserPlanLevel(numericUserId)

    // Fetch all service categories with their required plans
    const { docs: categories } = await payload.find({
      collection: 'service-categories',
      depth: 2,
      limit: 100,
      sort: 'name',
    })

    // Build nested tree and flatten for the UI
    const categoryTree = buildCategoryTree(categories, userPlan.level, userDefaultCategory)
    const flatCategories = flattenTree(categoryTree)

    return {
      categories: flatCategories,
      userPlanInfo: {
        currentPlanLevel: userPlan.level,
        currentPlanName: userPlan.name,
        userDefaultCategory,
      },
    }
  } catch (error) {
    console.error('Error in getOfferCategories:', error)
    return { categories: [], userPlanInfo: null, error: 'Internal server error' }
  }
}

// Validation action to check if a category is valid for the user
export async function validateOfferCategory(categoryPath: string): Promise<{
  valid: boolean
  error?: string
}> {
  try {
    const result = await getOfferCategories()

    if (result.error) {
      return { valid: false, error: result.error }
    }

    const category = result.categories.find((cat) => cat.fullPath === categoryPath)

    if (!category) {
      return { valid: false, error: 'Category not found' }
    }

    if (!category.isAvailable) {
      return {
        valid: false,
        error: `This category requires a ${category.requiredPlanName} plan`,
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error validating category:', error)
    return { valid: false, error: 'Validation failed' }
  }
}
