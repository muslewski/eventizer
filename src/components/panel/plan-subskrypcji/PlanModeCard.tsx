'use client'

import type { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanModeCardProps {
  title: string
  description: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
}

export function PlanModeCard({ title, description, icon, selected, onSelect }: PlanModeCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:border-accent/60',
        selected && 'border-accent',
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="text-accent mt-1">{icon}</div>
          <div className="flex flex-col gap-1">
            <CardTitle className="font-bebas text-2xl tracking-wide">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter>
        <Button variant={selected ? 'default' : 'outline'} className="w-full" onClick={onSelect}>
          Wybierz
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}
