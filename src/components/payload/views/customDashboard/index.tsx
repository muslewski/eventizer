import { type groupNavItems } from '@payloadcms/ui/shared'
import { ServerProps } from 'payload'
import { FC, Fragment } from 'react'
import { DashboardBanner } from './DashboardBanner'
import { DashboardGroup } from './DashboardGroup'
import { SubscriptionExpiredBanner } from './SubscriptionExpiredBanner'
import type { I18nClient } from '@payloadcms/translations'
import { adminGroups } from '@/lib/adminGroups'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { isReturningCustomer } from '@/actions/stripe/isReturningCustomer'
import type { User } from '@/payload-types'

type DashboardProps = {
  navGroups: ReturnType<typeof groupNavItems>
} & ServerProps

const Dashboard: FC<DashboardProps> = async (props) => {
  const {
    navGroups,
    i18n,
    payload,
    user,
    payload: {
      config: {
        routes: { admin: adminRoute },
      },
    },
  } = props

  // Check if user needs a subscription expired banner
  const typedUser = user as User | null
  const isServiceProvider = typedUser?.role === 'service-provider'
  const isClient = typedUser?.role === 'client'
  let showExpiredBanner = false

  if (typedUser) {
    if (isServiceProvider) {
      // Service provider without active subscription
      const subscriptionDetails = await getCurrentSubscriptionDetails(typedUser.id)
      showExpiredBanner = !subscriptionDetails.hasSubscription
    } else if (isClient) {
      // Client who was previously a paying customer (subscription was deleted)
      const returning = await isReturningCustomer(typedUser.id)
      showExpiredBanner = returning
    }
  }

  const featuredGroups = navGroups.filter(
    ({ label }) => label === adminGroups.featured.en || label === adminGroups.featured.pl,
  )
  const regularGroups = navGroups.filter(
    ({ label }) => label !== adminGroups.featured.en && label !== adminGroups.featured.pl,
  )

  return (
    <Fragment>
      <DashboardBanner />
      <div className="mt-10 mx-4 md:mx-10 lg:mx-16 mb-16 flex flex-col gap-8">
        {/* Subscription expired banner for service-providers */}
        {showExpiredBanner && (
          <SubscriptionExpiredBanner serviceCategory={typedUser?.serviceCategory} />
        )}
        {/* Featured Groups */}
        {featuredGroups.map(({ label, entities }, index) => (
          <DashboardGroup
            key={`featured-${index}`}
            label={label}
            entities={entities}
            adminRoute={adminRoute}
            i18n={i18n as I18nClient}
            payload={payload}
            user={user}
            isFeatured
          />
        ))}

        {/* Separator */}
        {featuredGroups.length > 0 && regularGroups.length > 0 && (
          <div className="h-px w-full bg-(--theme-border-color)" />
        )}

        {/* Regular Groups */}
        {regularGroups.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {regularGroups.map(({ label, entities }, entityIndex) => (
              <DashboardGroup
                key={entityIndex}
                label={label}
                entities={entities}
                adminRoute={adminRoute}
                i18n={i18n as I18nClient}
                payload={payload}
              />
            ))}
          </div>
        )}
      </div>
    </Fragment>
  )
}

export default Dashboard
