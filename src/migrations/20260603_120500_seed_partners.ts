// @ts-nocheck
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

/**
 * Seeds the partners collection with the 10 partners that were inline on the
 * homepage (Page 4) as of 2026-06-03. Idempotent on `name`: re-running won't
 * duplicate, and won't overwrite admin edits.
 *
 * `offer` is wired by looking the offer up via its stable `link` slug, so the
 * relationship resolves correctly in any environment that has the offer; when
 * absent (e.g. a fresh local DB), the partner is created with offer = null.
 * Logos are left null (none existed on the homepage; upload via panel later).
 */
const PARTNERS = [
  {
    name: 'SkyClub Białystok',
    tagline: 'Klub muzyczny · Białystok',
    accentColor: 'primary',
    externalUrl: 'https://sky-club.pl/',
    offerLink: 'SkyBialystok',
    quote:
      'Sky Club jest miejscem, w którym zabawa jest zawsze wspaniała. Nasz ekskluzywny klub powstał dla ludzi lubiących spędzać czas na parkiecie w doborowym towarzystwie. Lepiej nie trafisz!',
  },
  {
    name: 'Meetly',
    tagline: 'E-zaproszenia online',
    accentColor: 'blue',
    externalUrl: 'https://meetly.com.pl/',
    offerLink: null,
    quote: 'Najpiękniejsze zaproszenia online\nZ inteligentnym RSVP. Bez papieru w niecałą minutę.',
  },
  {
    name: 'Apartamenty Zielona Lipka',
    tagline: 'Mazury · jezioro Roś',
    accentColor: 'emerald',
    externalUrl: 'https://zielonalipka.pl/',
    offerLink: 'apartamenty-zielona-lipka',
    quote:
      'Apartamenty Zielona Lipka w Piszu to komfortowy wypoczynek nad jeziorem Roś na Mazurach. Obiekt oferuje nowoczesne apartamenty, taras oraz saunę, zapewniając idealne warunki do relaksu blisko natury.',
  },
  {
    name: 'Apartamenty pod Gromadzyniem',
    tagline: 'Bieszczady · Ustrzyki Dolne',
    accentColor: 'violet',
    externalUrl: 'https://www.facebook.com/apartamentypodgromadzyniem/',
    offerLink: 'apartamentypodgromadzyniem',
    quote:
      'Piękne Apartamenty pod Gromadzyniem. Basen, Sauna, Jacuzzi - wszystko czego potrzebujesz, żeby odpocząć i nabrać świeżego powietrza w pięknych Bieszczadzkich górach.',
  },
  {
    name: 'Princess Palace Gdańsk',
    tagline: 'Willa eventowa · Gdańsk',
    accentColor: 'rose',
    externalUrl: 'https://princesspalace.pl/',
    offerLink: 'princess-palace-gdansk',
    quote:
      'Princess Palace w Gdańsku to ekskluzywna willa na wyłączność, oferująca niezapomniane doświadczenia w tematycznych wnętrzach inspirowanych różnymi kulturami.',
  },
  {
    name: 'DJ SPDR',
    tagline: 'Muzyka i rozrywka',
    accentColor: 'accent',
    externalUrl: null,
    offerLink: 'Spdrofficial',
    quote:
      '20 lat doświadczenia jako DJ. Obecnie studiuje produkcję muzyki i DJing na Middlesex University w Londynie.',
  },
  {
    name: 'Misiak Events',
    tagline: 'Agencja eventowa · Kielce',
    accentColor: 'blue',
    externalUrl: 'https://www.facebook.com/misiak.events/',
    offerLink: 'nowa-oferta-2603-111740',
    quote:
      'Misiak Events – fotobudka, ciężki dym, iskry i napisy LED. Tworzymy efekt WOW na Twoim wydarzeniu',
  },
  {
    name: 'Wesela na głowie',
    tagline: 'Agencja eventowa · Tłuszcz',
    accentColor: 'emerald',
    externalUrl: 'https://www.instagram.com/wesele_na_glowie/',
    offerLink: 'Weselenaglowie',
    quote:
      'Wesele na Głowie – kompleksowa oprawa wesel i eventów. Efekty specjalne, atrakcje, foto & video oraz wyjątkowe momenty, które tworzą niezapomniane wydarzenia.',
  },
  {
    name: 'Santiago Events',
    tagline: 'Agencja eventowa · Płocochowo',
    accentColor: 'rose',
    externalUrl: 'https://www.instagram.com/santiago_eventss?igsh=OTBuenI0d2ozbTRl',
    offerLink: 'santiago-events',
    quote:
      'Santiago Events – fotobudka 360, fotolustro, budka telefoniczna, telefon życzeń i spektakularne fotostrefy LED. Tworzymy efekt WOW na każdym evencie.',
  },
  {
    name: 'Na Łośmiu Metrach',
    tagline: 'Domek na drzewie · Białystok',
    accentColor: 'accent',
    externalUrl: 'https://www.instagram.com/na_losmiu_metrach/',
    offerLink: 'nalosmiumetrach',
    quote: 'Domek na drzewie - Na Łośmiu Metrach. Najpiękniejsze Osiem metrów w Polsce.',
  },
]

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const p of PARTNERS) {
    const existing = await payload.find({
      collection: 'partners',
      where: { name: { equals: p.name } },
      limit: 1,
      req,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) continue

    let offer = null
    if (p.offerLink) {
      const found = await payload.find({
        collection: 'offers',
        where: { link: { equals: p.offerLink } },
        limit: 1,
        req,
        overrideAccess: true,
      })
      offer = found.docs[0]?.id ?? null
      if (!offer) {
        payload.logger.info(`[seed_partners] offer "${p.offerLink}" not found — ${p.name} seeded without link`)
      }
    }

    await payload.create({
      collection: 'partners',
      data: {
        name: p.name,
        tagline: p.tagline,
        quote: p.quote,
        accentColor: p.accentColor,
        externalUrl: p.externalUrl ?? undefined,
        offer,
      },
      req,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  // Delete only the seeded partners (by name); leave admin-created ones alone.
  for (const p of PARTNERS) {
    const existing = await payload.find({
      collection: 'partners',
      where: { name: { equals: p.name } },
      limit: 100,
      req,
      overrideAccess: true,
    })
    for (const doc of existing.docs) {
      await payload.delete({
        collection: 'partners',
        id: doc.id,
        req,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
    }
  }
}
