'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CircleHelp,
  ExternalLink,
  Type,
  FileText,
  ImagePlus,
  Contact,
  Lightbulb,
  Play,
} from 'lucide-react'

const TUTORIAL_URL = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'

const steps = [
  {
    icon: Type,
    title: 'Tytuł oferty',
    description:
      'Wybierz krótki, chwytliwy tytuł, który jasno opisuje Twoją usługę. Unikaj ogólników – bądź konkretny!',
    tip: 'Np. „Fotografia ślubna w plenerze" zamiast „Usługi fotograficzne"',
  },
  {
    icon: FileText,
    title: 'Treść oferty',
    description:
      'Opisz szczegółowo, co oferujesz. Uwzględnij zakres usług, warunki współpracy, cennik oraz wszystko, co wyróżnia Twoją ofertę na tle konkurencji.',
    tip: 'Dodaj listę tego, co klient otrzyma w ramach usługi',
  },
  {
    icon: ImagePlus,
    title: 'Zdjęcia',
    description:
      'Dodaj wysokiej jakości zdjęcia. Główne zdjęcie będzie widoczne na liście ofert, a zdjęcie w tle stworzy atmosferę na stronie Twojej oferty.',
    tip: 'Używaj dobrze oświetlonych zdjęć o rozdzielczości min. 1200×800 px',
  },
  {
    icon: Contact,
    title: 'Informacje kontaktowe',
    description:
      'Uzupełnij dane kontaktowe – telefon, email, adres oraz linki do mediów społecznościowych. Ułatwi to klientom kontakt z Tobą.',
    tip: 'Im więcej kanałów kontaktu podasz, tym więcej zapytań otrzymasz',
  },
]

const OfferContentInstructions = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 transition-colors">
          <CircleHelp className="size-4" />
          <span className="hidden sm:inline">Instrukcja dodawania oferty</span>
          <span className="sm:hidden">Instrukcja</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="gap-2 sm:gap-3">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 font-black text-xl sm:text-2xl md:text-3xl">
            <div className="shrink-0 flex items-center justify-center size-8 sm:size-10 rounded-full bg-primary/10 text-primary">
              <CircleHelp className="size-4 sm:size-5" />
            </div>
            Instrukcja dodawania oferty
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            Dowiedz się, jak stworzyć atrakcyjną ofertę, która przyciągnie klientów.
          </DialogDescription>
        </DialogHeader>

        {/* Video tutorial link */}
        <div className="pb-3 sm:pb-4 border-b border-border/50">
          <a
            href={TUTORIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 transition-all duration-200 group/link"
          >
            <div className="flex items-center justify-center size-7 sm:size-8 rounded-full bg-primary/10 group-hover/link:bg-primary/20 transition-colors">
              <Play className="size-3 sm:size-3.5 text-primary ml-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-primary">
                Obejrzyj poradnik wideo
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                YouTube
                <ExternalLink className="size-2.5 sm:size-3" />
              </span>
            </div>
          </a>
        </div>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="group relative flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all duration-200"
              >
                {/* Step number + icon */}
                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  <div className="flex items-center justify-center size-9 sm:size-11 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors duration-200">
                    <Icon className="size-4 sm:size-5" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-muted-foreground/60 font-montserrat">
                    {index + 1}/{steps.length}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {/* Tip */}
                  <div className="flex items-start gap-1.5 pt-1">
                    <Lightbulb className="size-3 sm:size-3.5 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
                    <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300/80 leading-snug italic">
                      {step.tip}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OfferContentInstructions
