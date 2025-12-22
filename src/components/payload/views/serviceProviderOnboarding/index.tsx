import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import React from 'react'
import { redirect } from 'next/navigation'
import { ServiceProviderOnboardingClient } from '@/components/payload/views/serviceProviderOnboarding/index.client'

const ServiceProviderOnboarding = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
  if (!initPageResult.req.user) {
    redirect('/app/auth/sign-in')
  }

  // Fetch service categories on server
  const categoriesResult = await initPageResult.req.payload.find({
    collection: 'service-categories',
    depth: 2,
    sort: 'name',
    limit: 100,
  })

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
          <h1>Wybierz kategorię oferowanych usług</h1>
          <p>Zanim zaczniesz, prosimy o wybranie odpowiedniej kategorii.</p>

          <ServiceProviderOnboardingClient
            categories={categoriesResult.docs}
            user={initPageResult.req.user}
          />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
export default ServiceProviderOnboarding
