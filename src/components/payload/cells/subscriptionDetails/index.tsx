import type { DefaultServerCellComponentProps } from 'payload'
import { checkSubscription } from '@/actions/stripe/checkSubscription'
import { SubscriptionCellClient } from './index.client'

// Nice ellegant way to display subscription cell in user list view
// so we should display current plan, renewal date, status, etc.
// in professional way, with shadcn and tailwind,
// for styiling we use tailwind with dark: mode support
// for colors we use golden accents, and --theme-elevation-50 100 etc for backgrounds
const SubscriptionCell = async ({ rowData }: DefaultServerCellComponentProps) => {
  const userId = rowData?.id as number | undefined

  if (!userId) {
    return <span className="text-[var(--theme-elevation-500)]">—</span>
  }

  const subscriptionStatus = await checkSubscription(userId)

  return <SubscriptionCellClient subscriptionStatus={subscriptionStatus} />
}

export default SubscriptionCell
