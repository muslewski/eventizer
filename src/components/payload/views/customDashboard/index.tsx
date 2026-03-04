import { type groupNavItems } from '@payloadcms/ui/shared'
import { ServerProps } from 'payload'
import { FC, Fragment } from 'react'
import { DashboardBanner } from './DashboardBanner'
import { DashboardGroup } from './DashboardGroup'
import { SubscriptionExpiredBanner } from './SubscriptionExpiredBanner'
import { CheckoutSuccessHandler } from './CheckoutSuccessHandler'
import { CreateOfferCTA } from './CreateOfferCTA'
import { BecomeServiceProviderCTA } from './BecomeServiceProviderCTA'
import { UserOfferCard } from './UserOfferCard'
import { UserOffersSection } from './UserOffersSection'
import { OfferLimitToast } from './OfferLimitToast'
import type { I18nClient } from '@payloadcms/translations'
import { adminGroups } from '@/lib/adminGroups'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'
import { isReturningCustomer } from '@/actions/stripe/isReturningCustomer'
import { getActiveSubscription } from '@/actions/stripe/getActiveSubscription'
import { getStripeCustomerId } from '@/actions/stripe/getStripeCustomerId'
import { resolveCategoryIconUrl } from '@/actions/resolveCategoryIconUrl'
import { getRolesAtOrAbove } from '@/access/utilities'
import type { User, Offer } from '@/payload-types'

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

  // Detect post-checkout redirect (Stripe redirects to /app?checkout=success)
  const resolvedSearchParams = props.searchParams ? await props.searchParams : {}
  const isCheckoutSuccess = resolvedSearchParams?.checkout === 'success'

  // Check if user needs a subscription expired banner
  const typedUser = user as User | null
  const isServiceProvider = typedUser?.role === 'service-provider'
  const isClient = typedUser?.role === 'client'
  let showExpiredBanner = false

  if (typedUser) {
    // Always check actual subscription status first
    const subscriptionDetails = await getCurrentSubscriptionDetails(typedUser.id)

    if (subscriptionDetails.hasSubscription) {
      // User has an active subscription
      if (isClient) {
        // Self-healing: client with active subscription should be a service-provider
        // This can happen if checkout.session.completed webhook wasn't received
        // (e.g. not selected in Stripe Dashboard production webhook events)
        const updateData: Record<string, unknown> = { role: 'service-provider' }

        // Try to restore category info from Stripe subscription metadata
        // (set via subscription_data.metadata during checkout session creation)
        try {
          const customerId = await getStripeCustomerId(typedUser.id)
          if (customerId) {
            const subscription = await getActiveSubscription(customerId)
            if (subscription?.metadata) {
              const categoryNames = subscription.metadata.categoryNames
                ? JSON.parse(subscription.metadata.categoryNames)
                : null
              const categorySlugs = subscription.metadata.categorySlugs
                ? JSON.parse(subscription.metadata.categorySlugs)
                : null

              if (categoryNames && Array.isArray(categoryNames)) {
                updateData.serviceCategory = categoryNames.join(' > ')
              }
              if (categorySlugs && Array.isArray(categorySlugs)) {
                updateData.serviceCategorySlug = categorySlugs.join('/')
              }
            }
          }
        } catch (metadataError) {
          payload.logger.error(`Dashboard self-heal: Error reading subscription metadata: ${metadataError}`)
        }

        await payload.update({
          collection: 'users',
          id: typedUser.id,
          data: updateData,
        })
        payload.logger.info(
          `Dashboard self-heal: Promoted user ${typedUser.id} from client to service-provider (has active subscription)`,
        )
      }
      showExpiredBanner = false
    } else {
      // No active subscription
      // If checkout just completed, skip the banner (webhook may still be processing)
      if (isCheckoutSuccess) {
        showExpiredBanner = false
      } else if (isServiceProvider) {
        showExpiredBanner = true
      } else if (isClient) {
        // Client who was previously a paying customer (subscription was deleted)
        const returning = await isReturningCustomer(typedUser.id)
        showExpiredBanner = returning
      }
    }
  }

  // Fetch user's offer(s) — amount depends on their personal maxOffers limit
  let userOffer: Offer | null = null
  let categoryIconUrl: string | null = null
  // Multi-offer mode state
  let userOffers: { offer: Offer; categoryIconUrl: string | null }[] = []
  let userOffersTotalDocs = 0

  const effectiveMaxOffers = typedUser?.maxOffers ?? 1
  const hasMultipleOfferLimit = effectiveMaxOffers > 1

  if (isServiceProvider && !showExpiredBanner && typedUser) {
    if (hasMultipleOfferLimit) {
      // Enterprise mode: fetch up to 3 most recent offers for the dashboard preview
      const offerResult = await payload.find({
        collection: 'offers',
        where: { user: { equals: typedUser.id } },
        sort: '-createdAt',
        limit: 3,
        depth: 1,
      })
      userOffersTotalDocs = offerResult.totalDocs
      userOffers = await Promise.all(
        offerResult.docs.map(async (offer) => ({
          offer,
          categoryIconUrl: offer.categorySlug
            ? await resolveCategoryIconUrl(offer.categorySlug)
            : null,
        })),
      )
    } else {
      // Standard single-offer mode
      const offerResult = await payload.find({
        collection: 'offers',
        where: { user: { equals: typedUser.id } },
        sort: 'createdAt',
        limit: 1,
        depth: 1,
      })
      userOffer = offerResult.docs[0] ?? null

      if (userOffer?.categorySlug) {
        categoryIconUrl = await resolveCategoryIconUrl(userOffer.categorySlug)
      }
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
        {/* Toast for offer limit redirect */}
        <OfferLimitToast />

        {/* Post-checkout success handler — shows success message and auto-refreshes */}
        {isCheckoutSuccess && <CheckoutSuccessHandler />}

        {/* Subscription expired banner for service-providers (hidden during checkout flow) */}
        {showExpiredBanner && !isCheckoutSuccess && (
          <SubscriptionExpiredBanner serviceCategory={typedUser?.serviceCategory} />
        )}

        {/* Offer card(s) or create CTA for active service-providers */}
        {isServiceProvider && !showExpiredBanner && (
          hasMultipleOfferLimit ? (
            // Enterprise: show up to 3 recent offers with "Zobacz wszystkie" button
            <UserOffersSection
              offers={userOffers}
              totalDocs={userOffersTotalDocs}
              adminRoute={adminRoute}
            />
          ) : userOffer ? (
            // Standard: show the single offer card
            <UserOfferCard
              offer={userOffer}
              categoryIconUrl={categoryIconUrl}
              adminRoute={adminRoute}
            />
          ) : (
            <CreateOfferCTA />
          )
        )}

        {/* CTA for clients to become service providers */}
        {isClient && !showExpiredBanner && <BecomeServiceProviderCTA />}

        {/* Featured Groups — only visible to moderators and admins */}
        {typedUser && getRolesAtOrAbove('moderator').includes(typedUser.role) &&
          featuredGroups.map(({ label, entities }, index) => (
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

        {/* Separator + Regular Groups — only visible to moderators and admins */}
        {typedUser && getRolesAtOrAbove('moderator').includes(typedUser.role) && (
          <>
            {featuredGroups.length > 0 && regularGroups.length > 0 && (
              <div className="h-px w-full bg-(--theme-border-color)" />
            )}

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
          </>
        )}
      </div>
    </Fragment>
  )
}

export default Dashboard
