import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Public proxy for offer video files.
 *
 * The `offer-video-uploads` collection scopes `read` to the uploader so that
 * the admin picker only shows a user's own videos.  However, the `<video>`
 * element fetches files directly from the browser (with cookies), which means
 * logged-in users who don't own the video get a 403.
 *
 * This route resolves the file via the Local API with `overrideAccess: true`
 * and streams it back — no cookies involved, so any visitor can watch the
 * video on a public offer page.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params

  const payload = await getPayload({ config: configPromise })

  // Find the upload doc by filename (overrideAccess so it always resolves)
  const result = await payload.find({
    collection: 'offer-video-uploads',
    where: { filename: { equals: decodeURIComponent(filename) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const doc = result.docs[0]
  if (!doc?.url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Build the internal URL to Payload's file endpoint
  const origin = req.nextUrl.origin
  const internalUrl = `${origin}${doc.url}`

  // Forward the request without cookies, preserving Range headers for seeking
  const headers: HeadersInit = {}
  const range = req.headers.get('range')
  if (range) headers['Range'] = range

  const response = await fetch(internalUrl, { headers })

  // Build response headers
  const responseHeaders = new Headers()
  const contentType = response.headers.get('content-type')
  if (contentType) responseHeaders.set('Content-Type', contentType)
  const contentLength = response.headers.get('content-length')
  if (contentLength) responseHeaders.set('Content-Length', contentLength)
  const acceptRanges = response.headers.get('accept-ranges')
  if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges)
  const contentRange = response.headers.get('content-range')
  if (contentRange) responseHeaders.set('Content-Range', contentRange)

  // Cache publicly for 1 hour, revalidate in background for 1 day
  responseHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')

  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}
