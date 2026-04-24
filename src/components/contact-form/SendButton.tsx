'use client'

import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SendButtonProps {
  isSubmitting: boolean
  label?: string
  submittingLabel?: string
  className?: string
}

export function SendButton({
  isSubmitting,
  label = 'Wyślij wiadomość',
  submittingLabel = 'Wysyłanie…',
  className,
}: SendButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      size="lg"
      className={className}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {submittingLabel}
        </>
      ) : (
        <>
          <Send className="size-4" />
          {label}
        </>
      )}
    </Button>
  )
}
