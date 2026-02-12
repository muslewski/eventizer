'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Media } from '@/payload-types'

/**
 * Resolves the category icon URL from the offer's category path (e.g. "music/dj")
 * by walking the service-categories collection tree.
 */
export async function resolveCategoryIconUrl(categoryPath: string): Promise<string | null> {
  try {
    const segments = categoryPath.split('/')
    const rootSlug = segments[0]

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'service-categories',
      where: { slug: { equals: rootSlug } },
      limit: 1,
      depth: 1,
    })

    const rootCategory = result.docs[0]
    if (!rootCategory) return null

    const getIconUrl = (icon: number | Media | null | undefined): string | null => {
      if (!icon || typeof icon === 'number') return null
      return icon.url || null
    }

    // If only root level, return root icon
    if (segments.length === 1) {
      return getIconUrl(rootCategory.icon)
    }

    // Walk subcategory levels
    type SubcategoryItem = {
      slug: string
      icon?: number | Media | null
      subcategory_level_1?: SubcategoryItem[] | null
      subcategory_level_2?: SubcategoryItem[] | null
    }

    let current: SubcategoryItem = rootCategory as SubcategoryItem
    for (let i = 1; i < segments.length; i++) {
      const children =
        (current as any)[`subcategory_level_${i}`] as SubcategoryItem[] | null | undefined
      const match = children?.find((c) => c.slug === segments[i])
      if (!match) break
      current = match
    }

    // Return the deepest matched icon, or fall back to root icon
    return getIconUrl(current.icon) || getIconUrl(rootCategory.icon)
  } catch {
    return null
  }
}
