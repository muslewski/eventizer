import { redirect } from 'next/navigation'

export default async function PanelPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  redirect(`/${lang}/panel/dashboard`)
}
