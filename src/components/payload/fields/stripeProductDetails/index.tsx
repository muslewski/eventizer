// Nice ellegant way to display plans
// so we should display price, number of active users, recurring interval, etc.
// in professional way, with shadcn and tailwind,
// for styiling we use tailwind with dark: mode support
// for colors we use golden accents, and --theme-elevation-50 100 etc for backgrounds

import type { UIFieldServerComponent } from 'payload'
import { StripeProductDetailsClient } from './index.client'

const StripeProductDetailsField: UIFieldServerComponent = () => {
  return <StripeProductDetailsClient />
}

export default StripeProductDetailsField
