'use client'

import { CheckCircle2 } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'

interface SuccessPanelProps {
  title: string
  description: string
  resetLabel?: string
  onReset: () => void
}

export function SuccessPanel({
  title,
  description,
  resetLabel = 'Wyślij kolejną wiadomość',
  onReset,
}: SuccessPanelProps) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.94, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -8 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="flex flex-col items-center justify-center gap-5 py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.12 }}
        className="relative flex size-16 items-center justify-center rounded-full border border-accent/40 bg-gradient-to-b from-accent/25 to-accent/[0.04]"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-accent/15 blur-xl"
        />
        <CheckCircle2 className="relative size-8 text-accent" />
      </motion.div>
      <div className="space-y-1.5">
        <p className="font-bebas text-2xl tracking-wide">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" className="mt-1" onClick={onReset}>
        {resetLabel}
      </Button>
    </motion.div>
  )
}
