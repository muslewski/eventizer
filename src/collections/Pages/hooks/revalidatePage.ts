import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'

// All configured Payload locales — see src/payload.config.ts -> localization.locales.
// The actual page routes are /[lang]/[slug] (and /[lang] for the home page), so
// revalidatePath needs the locale-prefixed paths. The previous implementation
// passed the bare '/<slug>' which doesn't match any route in the route manifest,
// so Next.js silently no-ops the invalidation and stale HTML keeps serving.
const LOCALES = ['pl', 'en'] as const

const localizedPaths = (slug: string): string[] =>
  LOCALES.map((locale) => (slug === 'home' ? `/${locale}` : `/${locale}/${slug}`))

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const paths = localizedPaths(doc.slug)
      payload.logger.info(`Revalidating page at paths: ${paths.join(', ')}`)
      paths.forEach((path) => revalidatePath(path))
      revalidateTag('pages-sitemap', 'default')
    }

    // If the page was previously published and is now not, revalidate the old paths
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPaths = localizedPaths(previousDoc.slug)
      payload.logger.info(`Revalidating old page at paths: ${oldPaths.join(', ')}`)
      oldPaths.forEach((path) => revalidatePath(path))
      revalidateTag('pages-sitemap', 'default')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const paths = localizedPaths(doc?.slug ?? 'home')
    paths.forEach((path) => revalidatePath(path))
    revalidateTag('pages-sitemap', 'default')
  }

  return doc
}
