'use client'

import FooterList from '@/components/frontend/Footer/FooterList'
import HeaderLogo from '@/components/frontend/Header/Logo'
import { Button } from '@/components/ui/button'
import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full relative h-fit bg-linear-to-br from-stone-100 dark:from-[#1A1A1A] to-stone-300 dark:to-[#0A0A0A] flex flex-col gap-16 py-16 px-8 sm:px-16 shadow-inner shadow-stone-500 dark:shadow-stone-900">
      {/* Absolute line gradient top */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-stone-300/20 dark:from-stone-950 via-stone-200 dark:via-stone-400/50 to-stone-300/20 dark:to-stone-950 " />

      {/* Main content */}
      <div className="flex flex-wrap gap-16 justify-between items-end">
        {/* Left part */}
        <div className="flex flex-col gap-4 max-w-3xs">
          <Link
            href="/"
            prefetch
            className="xl:text-7xl md:text-6xl text-5xl font-bebas max-w-7xl text-primary"
          >
            Eventizer
          </Link>
          <p className="text-primary/75">Platforma, która pomaga Ci stworzyć event bez stresu.</p>
          <ul className="flex flex-col gap-2">
            <li>
              <Button variant="link" className="text-primary/75" asChild>
                <Link href="mailto:kontakt@eventizer.pl">
                  <Mail />
                  kontakt@eventizer.pl
                </Link>
              </Button>
            </li>
            <li>
              <Button variant="link" className="text-primary/75" asChild>
                <Link href="tel:+48123456789">
                  <Phone />
                  +48 123 456 789
                </Link>
              </Button>
            </li>
            <li>
              <Button variant="link" className="text-primary/75 h-fit" asChild>
                <Link href="https://goo.gl/maps/example" target="_blank" rel="noopener noreferrer">
                  <MapPin />
                  <span className="text-wrap">ul. Przykładowa 1, 00-001 Warszawa</span>
                </Link>
              </Button>
            </li>
          </ul>
        </div>

        {/* Right Part */}
        <div className="h-fit w-fit flex flex-wrap gap-24">
          <FooterList
            header="O serwisie"
            linkItems={[
              { href: '/o-nas', label: 'O Nas' },
              { href: '/kontakt', label: 'Kontakt' },
              { href: '/kariera', label: 'Kariera', todo: true },
            ]}
          />
          <FooterList
            header="Dla użytkowników"
            linkItems={[
              { href: '/ogłoszenia', label: 'Ogłoszenia', todo: true },
              { href: '/auth/sign-in', label: 'Tworzenia konta klienta' },
              { href: '/faq', label: 'Centrum Pomocy / FAQ', todo: true },
              { href: '/app', label: 'Panel Klienta' },
            ]}
          />
          <FooterList
            header="Dla usługodawców"
            linkItems={[
              { href: '/auth/sign-in/service-provider', label: 'Tworzenia konta usługodawcy' },
              { href: '/app/collections/offers', label: 'Zarządzanie usługami' },
              { href: '/app', label: 'Panel Usługodawcy' },
            ]}
          />
        </div>
      </div>

      {/* line */}
      <div className="w-full h-0.5 bg-linear-to-r from-yellow-500/20 to-transparent " />

      {/* bottom part */}
      <div className="w-full flex flex-col sm:flex-row gap-8 justify-between sm:items-center">
        {/* Left */}
        <div className="flex flex-wrap gap-2 sm:gap-8 items-center">
          <div className="h-16 *:mix-blend-difference">
            <HeaderLogo />
          </div>
          <p className="text-primary/75">
            {new Date().getFullYear()} &copy; Eventizer. Wszelkie prawa zastrzeżone.
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-wrap gap-2 sm:gap-8">
          <Button variant="link" className="text-primary/75" asChild>
            <Link href="/polityka-prywatnosci" prefetch>
              Polityka Prywatności
            </Link>
          </Button>
          <Button variant="link" className="text-primary/75" asChild>
            <Link href="/regulamin" prefetch>
              Regulamin
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  )
}
