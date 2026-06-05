import { adminOrHigher, publicAccess } from '@/access'
import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { revalidatePath } from 'next/cache'
import {
  CollectionConfig,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import type { Partner } from '@/payload-types'

const revalidatePartners: CollectionAfterChangeHook<Partner> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc
  payload.logger.info(`Revalidating all pages — partner ${doc.id} ("${doc.name}") changed`)
  revalidatePath('/', 'layout')
  return doc
}

const revalidatePartnersOnDelete: CollectionAfterDeleteHook<Partner> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc
  payload.logger.info(`Revalidating all pages — partner ${doc.id} was deleted`)
  revalidatePath('/', 'layout')
  return doc
}

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: {
    singular: { en: 'Partner', pl: 'Partner' },
    plural: { en: 'Partners', pl: 'Partnerzy Eventizer' },
  },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    group: adminGroups.website,
    defaultColumns: ['name', 'tagline', 'offer'],
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
    description: {
      en: 'Partners shown by the Partners (V2) block. Edit once here — reused across every page that picks them.',
      pl: 'Partnerzy wyświetlani przez blok Partnerzy (V2). Edytuj raz tutaj — wykorzystywani na każdej stronie, która ich wybierze.',
    },
  },
  access: {
    read: publicAccess,
    create: adminOrHigher,
    update: adminOrHigher,
    delete: adminOrHigher,
  },
  hooks: {
    afterChange: [revalidatePartners],
    afterDelete: [revalidatePartnersOnDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { en: 'Partner Name', pl: 'Nazwa partnera' },
    },
    {
      name: 'tagline',
      type: 'text',
      label: { en: 'Tagline', pl: 'Podtytuł' },
      admin: {
        description: {
          en: 'Short city/category descriptor shown next to the name, e.g. "Białystok" or "DJ na wesela".',
          pl: 'Krótki opis (miasto/kategoria) wyświetlany obok nazwy, np. "Białystok" lub "DJ na wesela".',
        },
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      label: { en: 'Spotlight quote / description', pl: 'Cytat / opis w wyróżnieniu' },
      admin: {
        description: {
          en: 'Optional short blurb shown when this partner is in the spotlight.',
          pl: 'Opcjonalny krótki opis wyświetlany gdy partner jest w centrum uwagi.',
        },
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Logo', pl: 'Logo' },
      admin: {
        description: {
          en: 'Optional. Falls back to a stylized initial if not provided.',
          pl: 'Opcjonalne. Wyświetlany jest inicjał, jeśli nie ustawione.',
        },
      },
    },
    {
      name: 'accentColor',
      type: 'text',
      defaultValue: '#E4A00B',
      label: { en: 'Accent color', pl: 'Kolor akcentu' },
      validate: (val: string | null | undefined) => {
        if (val == null || val === '') return true
        return /^#([0-9a-fA-F]{6})$/.test(val)
          ? true
          : 'Podaj kolor w formacie #RRGGBB (np. #10B981).'
      },
      admin: {
        components: {
          Field: '/components/payload/fields/AccentColorField',
        },
        description: {
          en: 'Brand accent color (hex) used to tint this partner in the Partners carousel.',
          pl: 'Kolor akcentu marki (hex) używany do podświetlenia partnera w karuzeli Partnerów.',
        },
      },
    },
    {
      name: 'offer',
      type: 'relationship',
      relationTo: 'offers',
      label: { en: 'Eventizer Offer', pl: 'Oferta na Eventizerze' },
      admin: {
        description: {
          en: 'Optional. Pick the partner’s offer to add a "Zobacz ofertę" button.',
          pl: 'Opcjonalne. Wybierz ofertę partnera, aby pokazać przycisk "Zobacz ofertę".',
        },
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      label: { en: 'Website URL', pl: 'Strona internetowa' },
      admin: {
        description: {
          en: 'Optional. Adds an "Odwiedź stronę" button linking to the partner\'s own site.',
          pl: 'Opcjonalne. Dodaje przycisk "Odwiedź stronę" prowadzący do strony partnera.',
        },
        placeholder: 'https://...',
      },
    },
    {
      name: 'showOnSignIn',
      type: 'checkbox',
      defaultValue: false,
      label: { en: 'Show on sign-in screen', pl: 'Pokaż na ekranie logowania' },
      admin: {
        description: {
          en: 'Show this partner in the "Zaufali nam najlepsi" row on the sign-in screens. Only partners with a logo appear; max 4, ordered by the list drag-order.',
          pl: 'Pokaż tego partnera w sekcji "Zaufali nam najlepsi" na ekranach logowania. Wyświetlani są tylko partnerzy z logo; maks. 4, w kolejności z listy.',
        },
      },
    },
  ],
}
