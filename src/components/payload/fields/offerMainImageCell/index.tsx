import type { DefaultServerCellComponentProps } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'
import { OfferMainImageCellClient } from './index.client'

async function resolveUploadUrl(cellData: unknown): Promise<string | null> {
  if (typeof cellData === 'object' && cellData !== null) {
    return (cellData as any)?.thumbnailURL || (cellData as any)?.url || null
  }
  if (typeof cellData === 'number') {
    const payload = await getPayload({ config })
    const upload = await payload.findByID({
      collection: 'offer-uploads',
      id: cellData,
      depth: 0,
    })
    return upload?.thumbnailURL || upload?.url || null
  }
  return null
}

function formatPrice(rowData: Record<string, unknown>): string | null {
  const hasPriceRange = Boolean(rowData?.hasPriceRange)
  if (hasPriceRange) {
    const from = Number(rowData?.priceFrom ?? 0)
    const to = Number(rowData?.priceTo ?? 0)
    if (from === 0 && to === 0) return null
    return `${from.toLocaleString('pl-PL')} - ${to.toLocaleString('pl-PL')} zł`
  }
  const price = Number(rowData?.price ?? 0)
  if (price === 0) return null
  return `${price.toLocaleString('pl-PL')} zł`
}

export default async function OfferMainImageCell({
  cellData,
  rowData,
}: DefaultServerCellComponentProps) {
  const title = (rowData?.title as string) || 'Oferta'

  const [mainImageUrl, bgImageUrl] = await Promise.all([
    resolveUploadUrl(cellData),
    resolveUploadUrl(rowData?.backgroundImage),
  ])

  const price = formatPrice(rowData as Record<string, unknown>)

  const offerId = rowData?.id as number | string | undefined

  return (
    <OfferMainImageCellClient
      mainImageUrl={mainImageUrl}
      bgImageUrl={bgImageUrl || mainImageUrl}
      title={title}
      price={price}
      href={offerId ? `/app/collections/offers/${offerId}` : undefined}
    />
  )
}
