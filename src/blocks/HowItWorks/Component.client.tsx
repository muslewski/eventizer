'use client'

import HowItWorksCard from '@/blocks/HowItWorks/HowItWorksCard'
import { BlockHeader } from '@/components/frontend/Content/BlockHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type HowItWorksBlock as HowItWorksProps } from '@/payload-types'
import Image from 'next/image'
import { useState } from 'react'
import backgroundImage from '@/assets/howItWorks/how-it-works-background-compressed.png'
import { AnimatePresence, motion } from 'framer-motion'
import { type Transition } from 'framer-motion'
import { User, Briefcase } from 'lucide-react'

interface HowItWorksClientProps extends HowItWorksProps {
  className?: string
}

// Animation variants for container
const containerVariants = {
  hidden: (isSelectedClient: boolean) => ({
    opacity: 0,
    x: isSelectedClient ? -80 : 80,
    scale: 0.95,
  }),
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
      staggerChildren: 0.12,
      delayChildren: 0.1,
    } as Transition,
  },
  exit: (isSelectedClient: boolean) => ({
    opacity: 0,
    x: isSelectedClient ? 80 : -80,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    } as Transition,
  }),
}

// Animation variants for individual cards
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.9,
    rotateX: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    } as Transition,
  },
}

export const HowItWorksClient: React.FC<HowItWorksClientProps> = ({
  heading,
  description,
  client,
  serviceProvider,
  className,
}) => {
  const [isSelectedClient, setIsSelectedClient] = useState(true)
  const activeSteps = isSelectedClient ? client : serviceProvider

  return (
    <div className={cn('flex flex-col items-center gap-8', className)}>
      <BlockHeader heading={heading} description={description} />

      {/* Display switch button */}
      <div className="w-full max-w-xl py-2 flex">
        <Button
          variant={isSelectedClient ? 'default' : 'outline'}
          onClick={() => setIsSelectedClient(true)}
          className="w-1/2 rounded-l-full rounded-r-none"
        >
          <User className="h-4 w-4 mr-2" />
          Klient
        </Button>
        <Button
          variant={!isSelectedClient ? 'default' : 'outline'}
          onClick={() => setIsSelectedClient(false)}
          className="w-1/2 rounded-l-none rounded-r-full"
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Usługodawca
        </Button>
      </div>

      {/* Display content based on selection */}
      <div className="w-full px-8 mt-12 flex items-center justify-center relative">
        {/* Background image */}
        <div className="top-0 bottom-0 w-[calc(100%+80px)] h-full -left-10 -right-10 absolute ">
          <Image
            src={backgroundImage}
            className="object-cover opacity-50 dark:opacity-100 invert dark:invert-0"
            alt="Background"
            fill
            priority
          />
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-linear-to-b from-background via-background/50 to-background" />
        </div>

        <div className="w-full max-w-7xl items-center justify-center flex flex-col gap-16 sm:gap-24 relative overflow-visible">
          <AnimatePresence mode="wait" custom={isSelectedClient}>
            <motion.div
              key={isSelectedClient ? 'client' : 'serviceProvider'}
              custom={isSelectedClient}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col gap-16 sm:gap-24"
              style={{ perspective: 1000 }}
            >
              {activeSteps &&
                Object.values(activeSteps).map(
                  (step: HowItWorksProps['client']['step1'], index: number) => (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <HowItWorksCard
                        {...step}
                        stepNumber={index + 1}
                        isServiceProvider={!isSelectedClient}
                      />
                    </motion.div>
                  ),
                )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
