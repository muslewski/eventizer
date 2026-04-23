import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getHeaderBackgroundUrl } from '@/actions/panel/getHeaderBackground'
import { OfferWizardForm } from '@/components/panel/wizard/OfferWizardForm'

export const metadata = { title: 'Nowa oferta' }

export default async function NowaOfertaPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  const payload = await getPayload({ config })
  const user = await payload.findByID({
    collection: 'users',
    id: Number(session.user.id),
    depth: 0,
  })

  if (!user) {
    redirect(`/${lang}/auth/sign-in`)
  }

  if (user.role === 'client') {
    redirect(`/${lang}/panel/dashboard`)
  }

  const [categoriesResult, bgUrl] = await Promise.all([
    payload.find({
      collection: 'service-categories',
      depth: 2,
      sort: 'name',
      limit: 100,
    }),
    getHeaderBackgroundUrl(),
  ])

  return (
    <OfferWizardForm
      mode="create"
      categories={categoriesResult.docs}
      lang={lang}
      backgroundImageUrl={bgUrl}
      breadcrumbs={[
        { label: 'Oferty', href: '/panel/oferty' },
        { label: 'Nowa oferta' },
      ]}
      userServiceCategory={user.serviceCategory}
      userEmail={user.email}
    />
  )
}
