import type { Metadata } from 'next'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React from 'react'

import type { Page } from '@/payload-types'
import { notFound } from 'next/navigation'
import type { Config } from '@/payload-types'

type Locale = Config['locale']

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
    lang: Locale
  }>
}

export default async function Page({ params }: Args) {
  const { slug = 'home', lang } = await params
  const url = '/' + slug

  const page = await queryPageBySlug({
    slug,
    lang,
  })

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <article>
      <RenderHero {...hero} />
      <div className="flex flex-col gap-12 sm:gap-16 xl:gap-16 2xl:gap-28">
        <RenderBlocks blocks={layout} />
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = 'home', lang } = await params

  const page = await queryPageBySlug({
    slug,
    lang,
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = async ({ slug, lang }: { slug: string; lang: Locale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    locale: lang,
    fallbackLocale: 'pl',
  })

  return result.docs?.[0] || null
}
