import { getDictionary } from '@/lib/dictionary'

export default async function LocalizedUI({
  params,
}: Readonly<{
  params: Promise<{ lang: 'en' | 'pl' }>
}>) {
  const lang = (await params).lang
  const dict = await getDictionary(lang)

  return (
    <div>
      <a href="#">{dict.common.readMore}</a>
    </div>
  )
}
