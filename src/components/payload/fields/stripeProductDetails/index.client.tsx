'use client'

import { useEffect, useState, useCallback } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import {
  getStripeProductWithPrices,
  type StripeProductWithPrices,
} from '@/actions/stripe/products/getStripeProductWithPrices'
import type { StripePriceDetails } from '@/actions/stripe/products/getStripePrices'
import {
  RefreshCw,
  Package,
  CreditCard,
  Calendar,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export const StripeProductDetailsClient = () => {
  const { id } = useDocumentInfo()
  const stripeID = useFormFields(([fields]) => fields['stripeID']?.value as string | undefined)

  const [data, setData] = useState<StripeProductWithPrices | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
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
  }, [stripeID])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!id) {
    return (
      <div className="rounded-lg border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-50)] p-6">
        <div className="flex items-center gap-3 text-[var(--theme-elevation-500)]">
          <AlertCircle className="h-5 w-5" />
          <p>Save the document first to view Stripe product details.</p>
        </div>
      </div>
    )
  }

  if (!stripeID) {
    return (
      <div className="rounded-lg border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-50)] p-6">
        <div className="flex items-center gap-3 text-[var(--theme-elevation-500)]">
          <Package className="h-5 w-5" />
          <p>No Stripe Product ID linked to this plan.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-50)] p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="text-[var(--theme-elevation-600)]">
            Loading Stripe product details...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-400">Failed to load Stripe data</p>
            <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { product, prices, defaultPrice } = data

  return (
    <div className="space-y-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600">
            <Package className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-[var(--theme-text)]">Stripe Product Details</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--theme-elevation-600)] hover:bg-[var(--theme-elevation-100)] hover:text-[var(--theme-text)] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <a
            href={`https://dashboard.stripe.com/products/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--theme-elevation-100)] px-2.5 py-1.5 text-xs font-medium text-[var(--theme-elevation-700)] hover:bg-[var(--theme-elevation-150)] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View in Stripe
          </a>
        </div>
      </div>

      {/* Product Card */}
      <div className="rounded-xl border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-50)] overflow-hidden">
        {/* Product Header */}
        <div className="border-b border-[var(--theme-elevation-100)] bg-gradient-to-r from-[var(--theme-elevation-0)] to-[var(--theme-elevation-50)] px-5 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-semibold text-[var(--theme-text)]">{product.name}</h4>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    product.active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {product.active ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {product.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {product.description && (
                <p className="mt-1 text-sm text-[var(--theme-elevation-600)]">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          {/* Product Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--theme-elevation-500)]">
            <span className="font-mono bg-[var(--theme-elevation-100)] px-2 py-0.5 rounded">
              {product.id}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created: {product.created.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Updated: {product.updated.toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Prices Section */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-amber-500" />
            <h5 className="font-medium text-[var(--theme-text)]">Prices ({prices.length})</h5>
          </div>

          {prices.length === 0 ? (
            <p className="text-sm text-[var(--theme-elevation-500)]">
              No prices configured for this product.
            </p>
          ) : (
            <div className="grid gap-3">
              {prices.map((price) => (
                <PriceCard key={price.id} price={price} isDefault={price.id === defaultPrice?.id} />
              ))}
            </div>
          )}
        </div>

        {/* Metadata Section */}
        {Object.keys(product.metadata).length > 0 && (
          <div className="border-t border-[var(--theme-elevation-100)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-amber-500" />
              <h5 className="font-medium text-[var(--theme-text)]">Metadata</h5>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(product.metadata).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--theme-elevation-100)] px-2.5 py-1 text-xs"
                >
                  <span className="font-medium text-[var(--theme-elevation-700)]">{key}:</span>
                  <span className="text-[var(--theme-elevation-600)]">{value}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface PriceCardProps {
  price: StripePriceDetails
  isDefault: boolean
}

function PriceCard({ price, isDefault }: PriceCardProps) {
  const formatPrice = (amount: number | null, currency: string) => {
    if (amount === null) return 'Custom'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount / 100)
  }

  const getIntervalLabel = (interval: string, count: number) => {
    if (count === 1) {
      return `per ${interval}`
    }
    return `every ${count} ${interval}s`
  }

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        isDefault
          ? 'border-amber-300 bg-amber-50/50 dark:border-amber-600/50 dark:bg-amber-950/20'
          : 'border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-0)] hover:border-[var(--theme-elevation-200)]'
      }`}
    >
      {isDefault && (
        <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
          Default
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--theme-text)]">
              {formatPrice(price.unitAmount, price.currency)}
            </span>
            {price.recurring && (
              <span className="text-sm text-[var(--theme-elevation-500)]">
                {getIntervalLabel(price.recurring.interval, price.recurring.intervalCount)}
              </span>
            )}
            {price.type === 'one_time' && (
              <span className="text-sm text-[var(--theme-elevation-500)]">one-time</span>
            )}
          </div>

          {price.nickname && (
            <p className="mt-1 text-sm text-[var(--theme-elevation-600)]">{price.nickname}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs bg-[var(--theme-elevation-100)] px-2 py-0.5 rounded text-[var(--theme-elevation-600)]">
              {price.id}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                price.active
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {price.active ? 'Active' : 'Inactive'}
            </span>

            {price.recurring?.trialPeriodDays && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {price.recurring.trialPeriodDays} day trial
              </span>
            )}

            {price.recurring?.usageType === 'metered' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Metered
              </span>
            )}
          </div>
        </div>

        <a
          href={`https://dashboard.stripe.com/prices/${price.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 rounded-md p-1.5 text-[var(--theme-elevation-400)] hover:bg-[var(--theme-elevation-100)] hover:text-[var(--theme-elevation-600)] transition-colors"
          title="View in Stripe"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Price Metadata */}
      {Object.keys(price.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--theme-elevation-100)]">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(price.metadata).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded bg-[var(--theme-elevation-100)] px-1.5 py-0.5 text-xs"
              >
                <span className="font-medium text-[var(--theme-elevation-600)]">{key}:</span>
                <span className="text-[var(--theme-elevation-500)]">{value}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StripeProductDetailsClient
