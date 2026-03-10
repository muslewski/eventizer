'use client'

import { useFormFields } from '@payloadcms/ui'
import { motion } from 'framer-motion'

const MAX_DISPLAY = 80
const WARN_THRESHOLD = 72

function getColor(length: number): { bar: string; text: string } {
  if (length <= WARN_THRESHOLD) return { bar: '#22c55e', text: 'text-green-500' }
  if (length <= MAX_DISPLAY) return { bar: '#eab308', text: 'text-yellow-500' }
  return { bar: '#ef4444', text: 'text-red-500' }
}

export default function TitleCharCounter() {
  const title = useFormFields(([fields]) => fields['title'])
  const value = typeof title?.value === 'string' ? title.value : ''
  const length = value.length

  const clampedLength = Math.min(length, MAX_DISPLAY)
  const progress = clampedLength / MAX_DISPLAY
  const remaining = MAX_DISPLAY - length
  const { bar: barColor, text: textColor } = getColor(length)

  return (
    <div className="mt-1.5 space-y-1.5">
      {/* Progress bar track */}
      <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: barColor }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Character count info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 dark:text-gray-500">
          {length} / {MAX_DISPLAY} znaków
        </span>
        <span className={`font-medium ${textColor}`}>
          {remaining >= 0
            ? `${remaining} pozostało`
            : `${Math.abs(remaining)} ponad limit – tytuł zostanie przycięty`}
        </span>
      </div>
    </div>
  )
}
