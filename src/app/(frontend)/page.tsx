import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-white p-6 text-black dark:bg-black dark:text-white md:p-12">
      <div className="flex flex-1 flex-col items-center justify-center">
        <Image
          alt="Payload Logo"
          height={65}
          src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
          width={65}
        />
        <h1 className="my-6 text-center text-3xl font-bold md:my-10 md:text-5xl lg:text-6xl">
          {user ? `Welcome back, ${user.email}` : 'Welcome to your new project.'}
        </h1>
        <div className="flex items-center gap-3">
          <a
            className="rounded bg-black px-4 py-2 text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="rounded border border-black bg-white px-4 py-2 text-black transition-opacity hover:opacity-80 dark:border-white dark:bg-black dark:text-white"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
      <footer className="flex flex-col items-center gap-2 text-center md:flex-row">
        <p className="m-0">Update this page by editing</p>
        <code className="rounded bg-neutral-200 px-2 py-1 dark:bg-neutral-800">
          app/(frontend)/page.tsx
        </code>
      </footer>
    </div>
  )
}
