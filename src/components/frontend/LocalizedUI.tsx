import { getDictionary } from '@/lib/dictionary'
import type { Config } from '@/payload-types'

type Locale = Config['locale']

export default async function LocalizedUI({
  params,
}: Readonly<{
  params: Promise<{ lang: Locale }>
}>) {
  const lang = (await params).lang
  const dict = await getDictionary(lang)

  return (
    <div>
      <a href="#">{dict.common.readMore}</a>
    </div>
  )
}
