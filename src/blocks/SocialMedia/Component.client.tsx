'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import { FaInstagram, FaFacebook, FaTiktok, FaXTwitter } from 'react-icons/fa6'
import Link from 'next/link'
import type { SocialMediaBlock as SocialMediaProps } from '@/payload-types'
import type { IconType } from 'react-icons'

interface SocialMediaClientProps extends SocialMediaProps {
  className?: string
}

interface SocialPlatform {
  key: string
  icon: IconType
  name: string
  gradient: string
  shadowColor: string
  data?: {
    enabled?: boolean | null
    url?: string | null
    description?: string | null
  } | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

export const SocialMediaClient: React.FC<SocialMediaClientProps> = ({
  heading,
  description,
  instagram,
  facebook,
  tiktok,
  twitter,
  className,
}) => {
  const platforms: SocialPlatform[] = [
    {
      key: 'instagram',
      icon: FaInstagram,
      name: 'Instagram',
      gradient: 'from-purple-600 via-pink-500 to-orange-400',
      shadowColor: 'shadow-pink-500/25',
      data: instagram,
    },
    {
      key: 'facebook',
      icon: FaFacebook,
      name: 'Facebook',
      gradient: 'from-blue-600 to-blue-500',
      shadowColor: 'shadow-blue-500/25',
      data: facebook,
    },
    {
      key: 'tiktok',
      icon: FaTiktok,
      name: 'TikTok',
      gradient: 'from-gray-900 via-gray-800 to-gray-900',
      shadowColor: 'shadow-gray-500/25',
      data: tiktok,
    },
    {
      key: 'twitter',
      icon: FaXTwitter,
      name: 'X',
      gradient: 'from-gray-900 to-black',
      shadowColor: 'shadow-gray-500/25',
      data: twitter,
    },
  ]

  const enabledPlatforms = platforms.filter((p) => p.data?.enabled && p.data?.url)

  if (enabledPlatforms.length === 0) {
    return null
  }

  return (
    <section className={cn('relative w-full', className)}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="relative z-10 mx-auto"
      >
        {/* Header */}
        <BlockHeader
          heading={heading}
          description={description}
          lines
          gap
          planet
          grid
          aurora
          overflowHidden
          cornerAccentColor="pink-400"
          className="mb-16"
        />

        {/* Social Cards Grid */}
        <motion.div
          variants={containerVariants}
          className={cn(
            'grid gap-6 md:gap-8',
            enabledPlatforms.length === 1 && 'grid-cols-1 max-w-md mx-auto',
            enabledPlatforms.length === 2 && 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto',
            enabledPlatforms.length === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            enabledPlatforms.length === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
          )}
        >
          {enabledPlatforms.map((platform) => (
            <motion.div key={platform.key} variants={itemVariants}>
              <Link
                href={platform.data?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <motion.div
                  whileHover={{ y: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={cn(
                    'relative p-8 rounded-2xl',
                    'bg-stone-50/50 dark:bg-stone-900/50',
                    'border-2 border-stone-200 dark:border-stone-800',
                    'group-hover:border-current',
                    'hover:shadow-lg',
                    'transition-all duration-1000',
                    'overflow-hidden',
                  )}
                  style={
                    {
                      '--hover-color':
                        platform.key === 'instagram'
                          ? '#E1306C'
                          : platform.key === 'facebook'
                            ? '#1877F2'
                            : platform.key === 'tiktok'
                              ? '#000000'
                              : '#000000',
                    } as React.CSSProperties
                  }
                >
                  {/* Subtle background tint on hover */}
                  <div
                    className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-5',
                      'bg-gradient-to-br',
                      platform.gradient,
                      'transition-opacity duration-300',
                    )}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Icon */}
                    <div
                      className={cn(
                        'mb-5 p-4 rounded-xl',
                        'bg-gradient-to-br',
                        platform.gradient,
                        'shadow-md',
                        platform.shadowColor,
                        'group-hover:scale-105',
                        'transition-all duration-300',
                      )}
                    >
                      <platform.icon className="size-8 text-white transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-semibold text-foreground transition-colors duration-300">
                      {platform.name}
                    </h3>

                    {/* Description */}
                    {platform.data?.description && (
                      <p className="mt-3 text-sm text-muted-foreground transition-colors duration-300 leading-relaxed">
                        {platform.data.description}
                      </p>
                    )}

                    {/* CTA Arrow */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-300"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-foreground">
                        Odwiedź profil
                      </span>
                      <motion.span
                        initial={{ x: -5 }}
                        animate={{ x: 0 }}
                        transition={{
                          repeat: Infinity,
                          repeatType: 'mirror',
                          duration: 0.8,
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-foreground"
                      >
                        →
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
