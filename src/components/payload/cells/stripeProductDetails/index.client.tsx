'use client'

import { useEffect, useState } from 'react'
import {
  getStripeProductWithPrices,
  type StripeProductWithPrices,
} from '@/actions/stripe/products/getStripeProductWithPrices'
import { Package, Loader2, AlertCircle } from 'lucide-react'

interface StripeProductDetailsCellProps {
  rowData: Record<string, unknown>
}

export const StripeProductDetailsCellClient = ({ rowData }: StripeProductDetailsCellProps) => {
  const stripeID = rowData?.stripeID as string | undefined

  const [data, setData] = useState<StripeProductWithPrices | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!stripeID) {
        setData(null)
        setError(null)
        return
      }

      setLoading(true)
      setError(null)

      const result = await getStripeProductWithPrices(stripeID)

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
        setData(null)
      }

      setLoading(false)
    }

    fetchData()
  }, [stripeID])

  // No Stripe ID
  if (!stripeID) {
    return (
      <div className="flex items-center gap-1.5 text-[var(--theme-elevation-400)]">
        <Package className="h-3.5 w-3.5" />
        <span className="text-xs">Not linked</span>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="text-xs">Failed</span>
      </div>
    )
  }

  // No data
  if (!data) return null

  const { defaultPrice, prices } = data

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount === null) return 'Custom pricing'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  }

  const getIntervalLabel = (interval: string, count: number) => {
    if (count === 1) {
      const labels: Record<string, string> = {
        day: '/ day',
        week: '/ week',
        month: '/ month',
        year: '/ year',
      }
      return labels[interval] || `/ ${interval}`
    }
    return `/ ${count} ${interval}s`
  }

  // Show default price or first available price
  const displayPrice = defaultPrice || prices[0]

  if (!displayPrice) {
    return <span className="text-xs text-[var(--theme-elevation-500)]">No prices set</span>
  }

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-base font-bold text-amber-600 dark:text-amber-400">
        {formatPrice(displayPrice.unitAmount, displayPrice.currency)}
      </span>
      {displayPrice.recurring && (
        <span className="text-xs text-[var(--theme-elevation-500)]">
          {getIntervalLabel(displayPrice.recurring.interval, displayPrice.recurring.intervalCount)}
        </span>
      )}
      {displayPrice.type === 'one_time' && (
        <span className="text-xs text-[var(--theme-elevation-500)]">one-time</span>
      )}
      {prices.length > 1 && (
        <span className="ml-1 text-xs text-[var(--theme-elevation-400)]">
          (+{prices.length - 1})
        </span>
      )}
    </div>
  )
}

export default StripeProductDetailsCellClient
