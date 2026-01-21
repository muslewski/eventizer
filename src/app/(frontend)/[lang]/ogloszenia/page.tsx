import HeroView from '@/app/(frontend)/[lang]/ogloszenia/HeroView'
import ListView from '@/app/(frontend)/[lang]/ogloszenia/ListView'
import type { Config } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

type Locale = Config['locale']

type Args = {
  params: Promise<{
    slug?: string
    lang: Locale
  }>
}

export default async function Page({ params }: Args) {
  const payload = await getPayload({ config })

  return (
    <>
      <HeroView payload={payload} />
      <ListView payload={payload} />
    </>
  )
}
