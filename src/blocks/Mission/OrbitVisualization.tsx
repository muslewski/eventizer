'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  Music,
  Cake,
  Utensils,
  Palette,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import eventizerLogoDark from '@/assets/eventizer-logo-1-dark.png'
import eventizerLogoLight from '@/assets/eventizer-logo-1-light.png'

const orbitItems: { icon: LucideIcon; label: string }[] = [
  { icon: Camera, label: 'Foto' },
  { icon: Music, label: 'DJ' },
  { icon: Cake, label: 'Torty' },
  { icon: Utensils, label: 'Catering' },
  { icon: Palette, label: 'Dekor' },
  { icon: PartyPopper, label: 'Eventy' },
]

const orbitAtmosphereParticles = [
  { top: '8%', left: '46%', delay: 0 },
  { top: '18%', left: '78%', delay: 0.5 },
  { top: '35%', left: '90%', delay: 1.1 },
  { top: '65%', left: '92%', delay: 0.7 },
  { top: '82%', left: '74%', delay: 1.4 },
  { top: '92%', left: '48%', delay: 0.9 },
  { top: '80%', left: '20%', delay: 1.7 },
  { top: '58%', left: '8%', delay: 0.3 },
  { top: '30%', left: '10%', delay: 1.9 },
  { top: '14%', left: '24%', delay: 1.2 },
]

export const OrbitVisualization: React.FC = () => {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-3xl" />
      <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-transparent via-primary/5 to-accent/5 blur-2xl" />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 160, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-3 rounded-full border border-primary/10"
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full border border-dashed border-border/30"
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-8 sm:inset-12 rounded-full border border-dashed border-border/20"
      />

      <div className="absolute inset-16 sm:inset-24 rounded-full border border-primary/10" />
      <div className="absolute inset-20 sm:inset-28 rounded-full bg-primary/5 blur-2xl" />

      {orbitAtmosphereParticles.map((particle, index) => (
        <motion.span
          key={`${particle.top}-${particle.left}`}
          className="absolute h-1 w-1 rounded-full bg-primary/30"
          style={{ top: particle.top, left: particle.left }}
          animate={{ opacity: [0.15, 0.55, 0.15], scale: [1, 1.6, 1] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay + index * 0.05,
          }}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative flex flex-col items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 blur-lg"
          />
          <div className="relative flex items-center justify-center w-[116px] h-[116px] sm:w-[134px] sm:h-[134px]">
            <Image
              src={eventizerLogoLight}
              alt="Eventizer"
              className="w-full h-full object-contain dark:hidden"
              unoptimized
            />
            <Image
              src={eventizerLogoDark}
              alt="Eventizer"
              className="w-full h-full object-contain hidden dark:block"
              unoptimized
            />
          </div>
        </motion.div>
      </div>

      {orbitItems.map((item, i) => {
        const angle = (360 / orbitItems.length) * i - 90
        const radius = 44

        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.5 + i * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute"
            style={{
              top: `${50 + radius * Math.sin((angle * Math.PI) / 180)}%`,
              left: `${50 + radius * Math.cos((angle * Math.PI) / 180)}%`,
            }}
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 2.5 + i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
              className="relative -translate-x-1/2 -translate-y-1/2"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-md shadow-black/5 transition-shadow hover:shadow-lg">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" strokeWidth={1.75} />
              </div>
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-[9px] sm:text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap">
                {item.label}
              </span>
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}