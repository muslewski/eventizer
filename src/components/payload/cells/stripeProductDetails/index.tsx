import { StripeProductDetailsCellClient } from './index.client'

const StripeProductDetailsCell = (props: { rowData: Record<string, unknown> }) => {
  return <StripeProductDetailsCellClient rowData={props.rowData} />
}

export default StripeProductDetailsCell
