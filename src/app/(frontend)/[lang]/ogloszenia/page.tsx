import HeroView from '@/app/(frontend)/[lang]/ogloszenia/HeroView'
import ListView from '@/app/(frontend)/[lang]/ogloszenia/ListView'
import type { Config } from '@/payload-types'
import config from '@payload-config'
import { getPayload } from 'payload'

type Locale = Config['locale']

type Args = {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{ strona?: string; kategoria?: string; szukaj?: string }>
}

export default async function Page({ params, searchParams }: Args) {
  const payload = await getPayload({ config })
  const { strona, kategoria, szukaj } = await searchParams

  return (
    <>
      <HeroView payload={payload} />
      <ListView payload={payload} strona={strona} kategoria={kategoria} szukaj={szukaj} />
    </>
  )
}
