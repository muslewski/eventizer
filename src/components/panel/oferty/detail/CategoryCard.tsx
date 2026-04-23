import { Tags } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { InfoCardShell } from './InfoCardShell'

interface CategoryCardProps {
  categoryName: string | null | undefined
}

export function CategoryCard({ categoryName }: CategoryCardProps) {
  return (
    <InfoCardShell
      icon={Tags}
      title="Kategoria"
      description="Branża, w której działasz"
    >
      {categoryName ? (
        <Badge
          variant="outline"
          className="h-auto max-w-full whitespace-normal break-words rounded-md text-left leading-snug"
        >
          {categoryName}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">Brak kategorii</span>
      )}
    </InfoCardShell>
  )
}
