'use client'

import { SpanLikeH3 } from '@/components/frontend/Content/SpanLikeH3'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CircleHelp, ExternalLink } from 'lucide-react'

const TUTORIAL_URL = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'

const OfferContentInstructions = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-elevation-150)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)'
          }}
        >
          <CircleHelp size={16} />
          <span>Instrukcja dodawania oferty</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl!">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 font-black text-4xl">
            <CircleHelp size={32} />
            Instrukcja dodawania oferty
          </DialogTitle>
          <DialogDescription className="text-lg">
            Dowiedz się, jak stworzyć atrakcyjną ofertę, która przyciągnie klientów.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h3 className="text-3xl ">1. Tytuł oferty</h3>
            <p className="text-muted-foreground leading-relaxed">
              Wybierz krótki, chwytliwy tytuł, który jasno opisuje Twoją usługę. Unikaj ogólników –
              bądź konkretny!
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h3 className="text-3xl ">2. Treść oferty</h3>
            <p className="text-muted-foreground leading-relaxed">
              Opisz szczegółowo, co oferujesz. Uwzględnij zakres usług, warunki współpracy, cennik
              oraz wszystko, co wyróżnia Twoją ofertę na tle konkurencji.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h3 className="text-3xl ">3. Zdjęcia</h3>
            <p className="text-muted-foreground leading-relaxed">
              Dodaj wysokiej jakości zdjęcia. Główne zdjęcie będzie widoczne na liście ofert, a
              zdjęcie w tle stworzy atmosferę na stronie Twojej oferty.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h3 className="text-3xl ">4. Informacje kontaktowe</h3>
            <p className="text-muted-foreground leading-relaxed">
              Uzupełnij dane kontaktowe – telefon, email, adres oraz linki do mediów
              społecznościowych. Ułatwi to klientom kontakt z Tobą.
            </p>
          </div>

          <div className="mt-4 pt-6 border-t">
            <a
              href={TUTORIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
            >
              <ExternalLink size={18} />
              Obejrzyj poradnik wideo na YouTube
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OfferContentInstructions
