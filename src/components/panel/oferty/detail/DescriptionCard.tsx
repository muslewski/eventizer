import { FileText } from 'lucide-react'
import { InfoCardShell } from './InfoCardShell'

interface DescriptionCardProps {
  shortDescription: string | null | undefined
}

export function DescriptionCard({ shortDescription }: DescriptionCardProps) {
  const hasDescription = shortDescription && shortDescription.trim().length > 0

  return (
    <InfoCardShell
      icon={FileText}
      title="Opis"
      description="Krótkie streszczenie oferty"
    >
      {hasDescription ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm italic leading-relaxed text-muted-foreground">
            {shortDescription}
          </p>
          <span className="text-xs text-muted-foreground/70">
            Pełny opis dostępny na stronie oferty.
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak krótkiego opisu</span>
      )}
    </InfoCardShell>
  )
}
