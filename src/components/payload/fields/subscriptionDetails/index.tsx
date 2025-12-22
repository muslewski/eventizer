import type { UIFieldServerComponent } from 'payload'
import { checkSubscription } from '@/actions/stripe/checkSubscription'
import { SubscriptionDetailsClient } from './index.client'

const SubscriptionDetails: UIFieldServerComponent = async ({ payload, data }) => {
  // Data should contain the user document we're viewing
  const userId = data?.id as number | undefined

  if (!userId) {
    return (
      <div className="p-4 text-[var(--theme-elevation-600)]">
        Nie można załadować danych subskrypcji - brak ID użytkownika.
      </div>
    )
  }

  // Fetch subscription status from Stripe
  const subscriptionStatus = await checkSubscription(userId)

  return <SubscriptionDetailsClient userId={userId} subscriptionStatus={subscriptionStatus} />
}

export default SubscriptionDetails
