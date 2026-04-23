import { Compass } from 'lucide-react'
import { InfoCardShell } from './InfoCardShell'

interface RadiusCardProps {
  radiusKm: number | null | undefined
}

export function RadiusCard({ radiusKm }: RadiusCardProps) {
  return (
    <InfoCardShell
      icon={Compass}
      title="Zasięg"
      description="Promień dojazdu"
    >
      {radiusKm != null ? (
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-accent/50 text-accent"
          >
            <Compass className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-semibold leading-none tabular-nums">
              {radiusKm} km
            </span>
            <span className="text-xs text-muted-foreground">od lokalizacji</span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Brak danych</span>
      )}
    </InfoCardShell>
  )
}
