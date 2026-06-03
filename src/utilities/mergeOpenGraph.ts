import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Twój event. Nasi profesjonaliści. Znajdź i porównaj sprawdzonych usługodawców eventowych — DJ-e, fotografów, sale, catering i więcej — w jednym miejscu.',
  images: [
    {
      url: getServerSideURL() + '/og-image.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  ],
  locale: 'pl_PL',
  siteName: 'Eventizer',
  title: 'Eventizer',
}

export const mergeOpenGraph = (og?: Partial<Metadata['openGraph']>): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
