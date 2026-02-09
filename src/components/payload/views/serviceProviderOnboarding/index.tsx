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
  // check if edit mode
  const isEditMode = resolvedSearchParams?.edit === 'true'

  // If user already has an active subscription and is NOT in edit mode, redirect to account page
  if (subscriptionDetails.hasSubscription && !isEditMode) {
    redirect('/app/account')
  }

  // Fetch service categories on server
  const categoriesResult = await initPageResult.req.payload.find({
    collection: 'service-categories',
    depth: 2,
    sort: 'name',
    limit: 100,
  })

  // If edit mode, try to pre-populate the current category path
  const initialCategoryPath: number[] = []
  if (isEditMode && user.serviceCategorySlug) {
    const slugParts = user.serviceCategorySlug.split('/')

    // Find categories matching the slug path
    for (const slug of slugParts) {
      const category = categoriesResult.docs.find((cat) => cat.slug === slug)
      if (category) {
        initialCategoryPath.push(category.id)
      }
    }
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
          <h1>{isEditMode ? 'Zmień kategorię lub plan' : 'Wybierz kategorię oferowanych usług'}</h1>
          <p>
            {isEditMode
              ? 'Możesz zmienić kategorię usług lub przejść na inny plan subskrypcji.'
              : 'Zanim zaczniesz, prosimy o wybranie odpowiedniej kategorii.'}
          </p>

          <ServiceProviderOnboardingClient
            categories={categoriesResult.docs}
            user={initPageResult.req.user}
            isEditMode={isEditMode}
            currentSubscription={subscriptionDetails}
            initialCategoryPath={initialCategoryPath}
          />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
export default ServiceProviderOnboarding
