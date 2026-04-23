import type { CollectionBeforeChangeHook } from 'payload'
import { resolveCategoryByAnyFormat } from './resolveCategory'

export const populateCategoryData: CollectionBeforeChangeHook = async ({ data }) => {
  // Auto-populate categoryName and categorySlug from the category path.
  // Accept legacy "Name > Name" and "Name → Name" values too, and migrate
  // data.category to the canonical slug path so subsequent reads are clean.
  if (data?.category) {
    const { getOfferCategories } = await import('@/actions/getOfferCategories')
    const result = await getOfferCategories()
    const category = resolveCategoryByAnyFormat(result.categories, data.category)

    if (category) {
      data.category = category.fullPath
      data.categoryName = category.fullName
      data.categorySlug = category.fullPath
    }
  }
  return data
}
