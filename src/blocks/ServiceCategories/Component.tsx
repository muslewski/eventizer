import { ServiceCategoriesClient } from '@/blocks/ServiceCategories/Component.client'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import {
  ServiceCategory,
  type ServiceCategoriesBlock as ServiceCategoriesBlockProps,
} from '@/payload-types'

export const ServiceCategoriesBlock: React.FC<
  ServiceCategoriesBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ heading, description, categories, className }) => {
  const categoriesData = isExpandedDoc<ServiceCategory[]>(categories) ? [...categories] : []

  return (
    <ServiceCategoriesClient
      heading={heading}
      description={description}
      categories={categoriesData}
      className={className}
    />
  )
}
