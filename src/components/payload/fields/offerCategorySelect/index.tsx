import type { TextFieldServerComponent } from 'payload'
import { getOfferCategories } from '@/actions/getOfferCategories'
import { OfferCategorySelectClient } from './index.client'

export const OfferCategorySelect: TextFieldServerComponent = async (props) => {
  // Fetch categories on the server
  const result = await getOfferCategories()

  return (
    <OfferCategorySelectClient
      path={props.path}
      field={props.clientField}
      schemaPath={props.schemaPath}
      permissions={props.permissions}
      readOnly={props.readOnly}
      categories={result.categories}
      userPlanInfo={result.userPlanInfo}
      error={result.error}
    />
  )
}

export default OfferCategorySelect
