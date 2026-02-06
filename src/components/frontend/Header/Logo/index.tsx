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
      <div className="relative h-1/2 w-8">
        <Image
          src={Logo}
          alt="Eventizer Logo"
          className="mix-blend-normal! object-contain h-full w-auto drop-shadow-lg transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(250,189,35,0.5)]"
        />
      </div>
      <h3 className="text-3xl font-bebas tracking-wide text-white/10 text-shadow-sm text-shadow-white/20 transition-all duration-300 group-hover:from-accent/10 group-hover:via-accent/60 group-hover:to-accent">
        Eventizer
      </h3>
    </Link>
  )
}
