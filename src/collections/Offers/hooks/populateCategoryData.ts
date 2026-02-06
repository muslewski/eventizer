import type { CollectionBeforeChangeHook } from 'payload'

export const populateCategoryData: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Auto-populate categoryName and categorySlug from the category path
  if (data?.category) {
    const { getOfferCategories } = await import('@/actions/getOfferCategories')
    const result = await getOfferCategories()
    const category = result.categories.find((cat) => cat.fullPath === data.category)

    if (category) {
      data.categoryName = category.fullName
      data.categorySlug = category.fullPath
    }
  }
  return data
}
