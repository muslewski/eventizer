import { LanguageSwitcher } from '@/components/frontend/LanguageSwitcher.tsx'
import { ModeToggle } from '@/components/providers/Theme/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

import HeaderLogo from '@/components/frontend/Header/Logo'

export default function Header() {
  return (
    <header className="rounded-t-2xl h-16 relative z-20 top-16 w-full border-b border-white/20 bg-black/5 backdrop-blur-md flex justify-between items-center px-8">
      {/* Eventizer Logo */}
      <HeaderLogo />

      {/*  Menu  */}
      <nav className="flex gap-4 items-center ">
        <Link href="/ogloszenia">Ogłoszenia</Link>
        <Link href="/o-nas">O nas</Link>
        <Link href="/kontakt">Kontakt</Link>
        <ModeToggle />
        <LanguageSwitcher />
      </nav>

      {/* Call to action buttons */}
      <div className="flex gap-4">
        <Button variant="golden" asChild>
          <Link href="/app/auth/sign-in/service-provider" prefetch>
            Oferuj usługi
          </Link>
        </Button>
        <Button variant="blend" asChild>
          <Link href="/app/auth/sign-in" prefetch>
            Zaloguj się
          </Link>
        </Button>
      </div>
    </header>
  )
}
