'use client'

import { AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepStatus = 'current' | 'valid' | 'invalid' | 'upcoming'

export interface WizardStep {
  label: string
  status: StepStatus
}

interface WizardStepIndicatorProps {
  steps: readonly WizardStep[]
  onStepClick: (index: number) => void
  className?: string
}

export function WizardStepIndicator({
  steps,
  onStepClick,
  className,
}: WizardStepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.status === 'current')

  return (
    <nav aria-label="Kroki formularza" className={cn('w-full', className)}>
      <div className="flex items-start gap-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const isCurrent = step.status === 'current'
          const segmentPassed = index < currentIndex

          return (
            <div
              key={`${step.label}-${index}`}
              className={cn('flex items-start shrink-0', !isLast && 'flex-1')}
            >
              <div className="flex flex-col items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Krok ${index + 1}: ${step.label}${
                    step.status === 'invalid' ? ' (do uzupełnienia)' : ''
                  }`}
                  className={cn(
                    'relative inline-flex size-9 items-center justify-center rounded-full border-2 font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isCurrent &&
                      'border-accent bg-accent text-accent-foreground ring-4 ring-accent/15 focus-visible:ring-accent/40 cursor-default',
                    step.status === 'valid' &&
                      'border-accent/60 bg-accent/10 text-accent hover:bg-accent/20 focus-visible:ring-accent/40',
                    step.status === 'invalid' &&
                      'border-destructive/70 bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/40',
                    step.status === 'upcoming' &&
                      'border-border/60 bg-background/50 text-muted-foreground hover:border-accent/30 hover:text-foreground focus-visible:ring-accent/30',
                  )}
                >
                  {step.status === 'valid' ? (
                    <Check className="size-4" />
                  ) : step.status === 'invalid' ? (
                    <AlertCircle className="size-4" />
                  ) : (
                    <span className="text-xs tabular-nums">{index + 1}</span>
                  )}
                </button>
                <span
                  className={cn(
                    'hidden md:inline text-[11px] text-center leading-tight max-w-[8rem] px-1',
                    isCurrent && 'font-medium text-foreground',
                    step.status === 'valid' && 'text-muted-foreground',
                    step.status === 'invalid' && 'text-destructive',
                    step.status === 'upcoming' && 'text-muted-foreground/70',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex-1 h-0.5 rounded-full transition-colors duration-200 min-w-3 mx-1 mt-[17px]',
                    segmentPassed ? 'bg-accent/40' : 'bg-border/40',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
