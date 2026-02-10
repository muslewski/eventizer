import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import React from 'react'
import { redirect } from 'next/navigation'
import { ServiceProviderOnboardingClient } from '@/components/payload/views/serviceProviderOnboarding/index.client'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

const ServiceProviderOnboarding = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
  if (!initPageResult.req.user) {
    redirect('/auth/sign-in')
  }

  const user = initPageResult.req.user
  const resolvedSearchParams = await searchParams

  // Check subscription status
  const subscriptionDetails = await getCurrentSubscriptionDetails(user.id)
  // check if edit mode or renew mode
  const isEditMode = resolvedSearchParams?.edit === 'true'
  const isRenewMode = resolvedSearchParams?.renew === 'true'

  // Admins and moderators shouldn't access the onboarding page
  if (user.role === 'admin' || user.role === 'moderator') {
    redirect('/app')
  }

  // If user already has an active subscription and is NOT in edit mode, redirect to dashboard
  if (subscriptionDetails.hasSubscription && !isEditMode) {
    redirect('/app')
  }

  // Fetch service categories on server
  const categoriesResult = await initPageResult.req.payload.find({
    collection: 'service-categories',
    depth: 2,
    sort: 'name',
    limit: 100,
  })

  // If edit mode or renew mode, try to pre-populate the current category path
  const initialCategoryPath: number[] = []
  if ((isEditMode || isRenewMode) && user.serviceCategorySlug) {
    const slugParts = user.serviceCategorySlug.split('/')

    // Find categories matching the slug path
    for (const slug of slugParts) {
      const category = categoriesResult.docs.find((cat) => cat.slug === slug)
      if (category) {
        initialCategoryPath.push(category.id)
      }
    }
  }

  // Determine page title and description
  const getTitle = () => {
    if (isEditMode) return 'Zmień kategorię lub plan'
    if (isRenewMode) return 'Odnów subskrypcję'
    return 'Wybierz kategorię oferowanych usług'
  }

  const getDescription = () => {
    if (isEditMode) return 'Możesz zmienić kategorię usług lub przejść na inny plan subskrypcji.'
    if (isRenewMode)
      return 'Twoja subskrypcja wygasła. Wybierz kategorię i plan, aby odnowić dostęp.'
    return 'Zanim zaczniesz, prosimy o wybranie odpowiedniej kategorii.'
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div>
          <h1>{getTitle()}</h1>
          <p>{getDescription()}</p>

          <ServiceProviderOnboardingClient
            categories={categoriesResult.docs}
            user={initPageResult.req.user}
            isEditMode={isEditMode}
            isRenewMode={isRenewMode}
            currentSubscription={subscriptionDetails}
            initialCategoryPath={initialCategoryPath}
          />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
export default ServiceProviderOnboarding
