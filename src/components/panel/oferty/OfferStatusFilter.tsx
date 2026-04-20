'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface OfferStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function OfferStatusFilter({ value, onChange }: OfferStatusFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v)}
      className="flex-wrap w-full sm:w-fit"
    >
      <ToggleGroupItem value="all">Wszystkie</ToggleGroupItem>
      <ToggleGroupItem value="published">Opublikowane</ToggleGroupItem>
      <ToggleGroupItem value="draft">Robocze</ToggleGroupItem>
    </ToggleGroup>
  )
}
