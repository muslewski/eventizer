import { getPayload } from 'payload'
import config from '@payload-config'
import HeaderClient from './index.client'
import type { NavCategory } from './NavigationLinks'

export default async function Header() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'service-categories',
    limit: 20,
    depth: 1,
    sort: '_order',
    select: {
      name: true,
      slug: true,
      icon: true,
      description: true,
    },
  })

  const categories: NavCategory[] = docs.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? null,
    iconUrl:
      cat.icon && typeof cat.icon === 'object' && 'url' in cat.icon ? (cat.icon.url ?? null) : null,
  }))

  return <HeaderClient categories={categories} />
}
