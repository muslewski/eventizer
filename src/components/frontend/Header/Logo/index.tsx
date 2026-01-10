import Link from 'next/link'
import Image from 'next/image'

import Logo from '@/assets/eventizer-icon-1.png'

export default function HeaderLogo() {
  return (
    <Link
      href="/"
      prefetch
      className="group h-full flex items-center gap-3 transition-transform duration-300 hover:scale-105"
    >
      <div className="relative h-1/2 w-auto">
        <Image
          src={Logo}
          alt="Eventizer Logo"
          className="!mix-blend-normal h-full w-auto drop-shadow-lg transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
        />
      </div>
      <h3 className="text-3xl font-bebas tracking-wide text-white/10 text-shadow-sm text-shadow-white/20 transition-all duration-300 group-hover:from-amber-50 group-hover:via-yellow-200 group-hover:to-amber-400">
        Eventizer
      </h3>
    </Link>
  )
}
