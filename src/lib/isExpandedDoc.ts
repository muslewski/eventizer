// this function could be adjusted as you see fit
export function isExpandedDoc<T>(doc: any): doc is T {
  if (typeof doc === 'object') return true
  return false
}
