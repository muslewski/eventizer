import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { getSubmittedForms } from '@/actions/panel/forms'
import { PanelBreadcrumb } from '@/components/panel/PanelBreadcrumb'
import { FormularzeTable } from '@/components/panel/formularze/FormularzeTable'

export default async function FormularzePage({
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

  const formsResult = await getSubmittedForms(user.id)
  const forms = formsResult.success ? formsResult.data : []

  return (
    <div className="flex flex-col gap-6">
      <PanelBreadcrumb segments={[{ label: 'Formularze' }]} lang={lang} />
      <h1 className="font-bebas text-3xl tracking-wide">Formularze</h1>
      <FormularzeTable forms={forms} lang={lang} />
    </div>
  )
}
