import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['pl', 'en']
const DEFAULT_LOCALE = 'pl'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if pathname already has a locale prefix
  const pathnameLocale = LOCALES.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  // If pathname has a non-default locale, set cookie and let it through
  if (pathnameLocale) {
    const response = NextResponse.next()

    // Remember the locale preference (only for non-default)
    if (pathnameLocale !== DEFAULT_LOCALE) {
      response.cookies.set('NEXT_LOCALE', pathnameLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    } else {
      // If explicitly visiting /pl/..., clear the cookie (back to default)
      response.cookies.delete('NEXT_LOCALE')
    }

    return response
  }

  // No locale prefix - check cookie for preference
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value

  // If user previously chose a non-default locale, redirect to it
  if (cookieLocale && cookieLocale !== DEFAULT_LOCALE && LOCALES.includes(cookieLocale)) {
    return NextResponse.redirect(new URL(`/${cookieLocale}${pathname}`, request.url))
  }

  // Default: rewrite to Polish (URL stays clean)
  return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}`, request.url))
}

export const config = {
  matcher: [
    // Skip all internal paths (_next), admin panel (/app)
    '/((?!api|app|fonts|assets|images|my-favicon|_next/static|_next/image|favicon.ico).*)',
  ],
}
