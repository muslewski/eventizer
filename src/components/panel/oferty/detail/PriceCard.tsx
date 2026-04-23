'use client'

import { useEffect, useRef } from 'react'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { Banknote } from 'lucide-react'
import type { Offer } from '@/payload-types'
import { InfoCardShell } from './InfoCardShell'

interface PriceCardProps {
  hasPriceRange: Offer['hasPriceRange']
  price: Offer['price']
  priceFrom: Offer['priceFrom']
  priceTo: Offer['priceTo']
}

const SPRING = { stiffness: 80, damping: 20 }
const ZLOTY = (n: number) => n.toLocaleString('pl-PL')

function useCountUp(target: number | null | undefined, active: boolean) {
  const reduceMotion = useReducedMotion()
  const base = useMotionValue(0)
  const spring = useSpring(base, SPRING)
  const display = useTransform(spring, (v) => ZLOTY(Math.round(v)))

  useEffect(() => {
    if (target == null) return
    if (reduceMotion) {
      base.set(target)
      spring.set(target)
      return
    }
    if (active) base.set(target)
  }, [active, reduceMotion, target, base, spring])

  return display
}

export function PriceCard({ hasPriceRange, price, priceFrom, priceTo }: PriceCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })

  const singlePriceDisplay = useCountUp(price ?? null, inView)
  const fromDisplay = useCountUp(priceFrom ?? null, inView)
  const toDisplay = useCountUp(priceTo ?? null, inView)

  let body: React.ReactNode
  if (!hasPriceRange) {
    body =
      price != null ? (
        <span className="text-2xl font-semibold text-accent">
          <motion.span>{singlePriceDisplay}</motion.span> zł
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Cena do ustalenia</span>
      )
  } else if (priceFrom != null && priceTo != null && priceFrom !== priceTo) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        <motion.span>{fromDisplay}</motion.span>
        <span className="mx-1 text-muted-foreground/80"> – </span>
        <motion.span>{toDisplay}</motion.span> zł
      </span>
    )
  } else if (priceFrom != null && priceTo != null) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        <motion.span>{fromDisplay}</motion.span> zł
      </span>
    )
  } else if (priceFrom != null) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        od <motion.span>{fromDisplay}</motion.span> zł
      </span>
    )
  } else if (priceTo != null) {
    body = (
      <span className="text-2xl font-semibold text-accent">
        do <motion.span>{toDisplay}</motion.span> zł
      </span>
    )
  } else {
    body = <span className="text-sm text-muted-foreground">Cena do ustalenia</span>
  }

  return (
    <InfoCardShell
      icon={Banknote}
      title="Cena"
      description="Cena lub zakres cenowy oferty"
    >
      <div ref={ref}>{body}</div>
    </InfoCardShell>
  )
}
