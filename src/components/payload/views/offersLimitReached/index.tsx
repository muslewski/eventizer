import { DefaultTemplate } from '@payloadcms/next/templates'
import type { AdminViewServerProps } from 'payload'
import { Gutter } from '@payloadcms/ui'
import { OffersLimitReachedClient } from './index.client'

const MAX_OFFERS_PER_USER = 10

export default function OffersLimitReachedView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
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
        <OffersLimitReachedClient maxOffers={MAX_OFFERS_PER_USER} />
      </Gutter>
    </DefaultTemplate>
  )
}
