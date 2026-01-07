import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'

import config from '@/payload.config'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 transition-colors">
      {/* Header with ModeToggle */}
      <header className="relative z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex justify-between items-center">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">Eventizer</div>
          <div className="flex items-center gap-4">
            <Link
              href={user ? '/app' : '/app/auth/sign-in'}
              className="px-6 py-2 text-sm font-medium text-purple-900 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
            >
              Zaloguj się
            </Link>
            <Link
              href={'/app/auth/sign-in#service-provider'}
              className="px-6 py-2 bg-purple-900 dark:bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 dark:hover:bg-purple-600 transition-colors"
            >
              Oferuj usługi
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Elegant background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/5 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 dark:bg-amber-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-purple-900/5 dark:border-purple-500/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-amber-500/5 dark:border-amber-400/10 rounded-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
          <div className="text-center space-y-12">
            {/* Logo/Brand mark */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-900 to-purple-700 dark:from-purple-600 dark:to-purple-400 shadow-2xl shadow-purple-900/20 dark:shadow-purple-500/20 mb-8">
              <span className="text-3xl font-bold text-amber-400">E</span>
            </div>

            {/* Main heading with elegant typography */}
            <div className="space-y-6">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="block bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 dark:from-purple-300 dark:via-purple-200 dark:to-purple-300 bg-clip-text text-transparent mb-4">
                  Eventizer
                </span>
              </h1>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-800 dark:text-gray-200 max-w-4xl mx-auto leading-relaxed">
                Łączymy ludzi z pasją{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 font-semibold text-purple-900 dark:text-purple-300">
                    do tworzenia
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-3 bg-amber-400/30 dark:bg-amber-500/20 -rotate-1"></span>
                </span>{' '}
                niezapomnianych chwil
              </h2>
            </div>

            {/* Professional description */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Profesjonalna platforma łącząca organizatorów wydarzeń z uczestnikami.
              <br />
              Twórz, odkrywaj i bierz udział w wyjątkowych doświadczeniach.
            </p>

            {/* Elegant CTA section */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Link
                className="group relative px-10 py-5 bg-purple-900 dark:bg-purple-700 text-white rounded-2xl font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/30 dark:hover:shadow-purple-600/30 hover:-translate-y-1 inline-flex"
                href={payloadConfig.routes.admin}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Rozpocznij teraz
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>

              <Link
                className="px-10 py-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-purple-900 dark:text-purple-300 border-2 border-purple-900/20 dark:border-purple-600/30 rounded-2xl font-semibold hover:bg-white dark:hover:bg-gray-800 hover:border-purple-900/40 dark:hover:border-purple-600/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                href={payloadConfig.routes.admin}
              >
                Zobacz wydarzenia
              </Link>
            </div>

            {/* Trust indicators / Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-16">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-900 dark:text-purple-300 mb-2">
                  1000+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-light">Wydarzeń</div>
              </div>
              <div className="text-center border-x border-purple-900/10 dark:border-purple-500/20">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent mb-2">
                  50K+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-light">
                  Uczestników
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-900 dark:text-purple-300 mb-2">
                  500+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-light">
                  Organizatorów
                </div>
              </div>
            </div>

            {/* Golden accent decorative element */}
            <div className="flex justify-center items-center gap-2 pt-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-500 dark:via-amber-400 to-transparent"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></div>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-500 dark:via-amber-400 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Elegant bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent"></div>
      </section>
    </div>
  )
}
