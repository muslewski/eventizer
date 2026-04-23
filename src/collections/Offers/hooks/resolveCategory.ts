interface CategoryLike {
  fullPath: string
  fullName: string
}

/**
 * Find a category by either:
 *   - the canonical slug path  ("catering-napoje/catering-eventowy")
 *   - the human name path with "→"  ("Catering i Napoje → Catering eventowy")
 *   - the legacy name path with "> " ("Catering i Napoje > Catering eventowy")
 *
 * The wizard emits the slug form today, but older offers were saved with
 * the legacy name path, and admin-entered values sometimes use the arrow
 * separator. Accepting all three keeps them self-healing on next save.
 */
export function resolveCategoryByAnyFormat<T extends CategoryLike>(
  categories: T[],
  value: string,
): T | undefined {
  if (!value) return undefined
  const normalizedInput = normalize(value)
  return categories.find(
    (cat) =>
      cat.fullPath === value ||
      cat.fullName === value ||
      normalize(cat.fullName) === normalizedInput,
  )
}

function normalize(str: string): string {
  return str.replace(/\s*[→>]\s*/g, ' > ').trim()
}
