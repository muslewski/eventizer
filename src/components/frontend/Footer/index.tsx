'use client'

import FooterList from '@/components/frontend/Footer/FooterList'
import HeaderLogo from '@/components/frontend/Header/Logo'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
}

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 1,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
}

const glowVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: 'easeOut',
    },
  },
}

const floatAnimation = {
  y: [0, -6, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export default function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
      variants={containerVariants}
      className="mt-24 sm:mt-32 w-full relative h-fit bg-linear-to-br from-stone-50 via-stone-100 to-stone-200 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex flex-col gap-12 py-20 px-8 sm:px-16 lg:px-24 overflow-hidden"
    >
      {/* Decorative top border with shimmer */}
      <motion.div
        variants={lineVariants}
        className="absolute top-0 left-0 w-full h-px origin-left bg-linear-to-r from-transparent via-amber-500/60 to-transparent"
      />
      <motion.div
        initial={{ x: '-100%' }}
        whileInView={{ x: '200%' }}
        viewport={{ once: true }}
        transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-1/4 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
      />

      {/* Subtle glow effect */}
      {/* <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-stone-500/5 blur-3xl pointer-events-none" /> */}

      {/* Main content */}
      <div className="flex flex-wrap gap-10 justify-between relative z-10">
        {/* Left part - Brand section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 max-w-sm">
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
            <Link
              href="/"
              prefetch
              className="xl:text-7xl md:text-6xl text-5xl font-bebas tracking-tight text-primary hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-300 inline-block"
            >
              Eventizer
            </Link>
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="text-base text-stone-600 dark:text-stone-400 leading-relaxed"
          >
            Platforma, która pomaga Ci stworzyć event bez stresu.
          </motion.p>

          <ul className="flex flex-col gap-3 mt-2">
            {[
              {
                href: 'mailto:kontakt@eventizer.pl',
                icon: Mail,
                text: 'kontakt@eventizer.pl',
              },
              {
                href: 'tel:+48123456789',
                icon: Phone,
                text: '+48 123 456 789',
              },
              {
                href: 'https://goo.gl/maps/example',
                icon: MapPin,
                text: 'ul. Przykładowa 1, 00-001 Warszawa',
                external: true,
              },
            ].map((item, index) => (
              <motion.li
                key={item.href}
                variants={itemVariants}
                custom={index}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Button
                  variant="ghost"
                  className="text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-transparent px-0 h-auto py-1 justify-start gap-3 group"
                  asChild
                >
                  <Link
                    href={item.href}
                    {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    <motion.span
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <item.icon className="size-4 shrink-0 group-hover:text-amber-500 transition-colors" />
                    </motion.span>
                    <span className="font-medium text-wrap text-left">{item.text}</span>
                  </Link>
                </Button>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right Part - Navigation */}
        <motion.div
          variants={containerVariants}
          className="h-fit w-fit flex flex-wrap gap-12 lg:gap-20"
        >
          {[
            {
              header: 'O serwisie',
              links: [
                { href: '/o-nas', label: 'O Nas' },
                { href: '/kontakt', label: 'Kontakt' },
                { href: '/kariera', label: 'Kariera', todo: true },
              ],
            },
            {
              header: 'Dla użytkowników',
              links: [
                { href: '/ogłoszenia', label: 'Ogłoszenia', todo: true },
                { href: '/auth/sign-in', label: 'Tworzenie konta klienta' },
                { href: '/faq', label: 'Centrum Pomocy / FAQ', todo: true },
                { href: '/app', label: 'Panel Klienta' },
              ],
            },
            {
              header: 'Dla usługodawców',
              links: [
                { href: '/auth/sign-in/service-provider', label: 'Tworzenie konta usługodawcy' },
                { href: '/app/collections/offers', label: 'Zarządzanie usługami' },
                { href: '/app', label: 'Panel Usługodawcy' },
              ],
            },
          ].map((section, index) => (
            <motion.div
              key={section.header}
              variants={itemVariants}
              custom={index}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <FooterList header={section.header} linkItems={section.links} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Divider line with shimmer */}
      <div className="relative">
        <motion.div
          variants={lineVariants}
          className="w-full h-px origin-left bg-gradient-to-r from-amber-500/40 via-stone-300 dark:via-stone-700 to-transparent"
        />
        <motion.div
          initial={{ x: '-100%' }}
          whileInView={{ x: '200%' }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, delay: 0.8, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-1/3 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
        />
      </div>

      {/* Bottom part */}
      <motion.div
        variants={itemVariants}
        className="w-full flex flex-col sm:flex-row gap-6 justify-between sm:items-center relative z-10"
      >
        {/* Left */}
        <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="h-12 *:mix-blend-difference"
          >
            <HeaderLogo />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-sm text-stone-500 dark:text-stone-500"
          >
            {new Date().getFullYear()} © Eventizer. Wszelkie prawa zastrzeżone.
          </motion.p>
        </div>

        {/* Right */}
        <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
          {[
            { href: '/polityka-prywatnosci', label: 'Polityka Prywatności' },
            { href: '/regulamin', label: 'Regulamin' },
          ].map((link, index, arr) => (
            <motion.div key={link.href} className="flex items-center">
              <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-transparent"
                  asChild
                >
                  <Link href={link.href} prefetch>
                    {link.label}
                  </Link>
                </Button>
              </motion.div>
              {index < arr.length - 1 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="text-stone-300 dark:text-stone-700 mx-1"
                >
                  |
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.footer>
  )
}
