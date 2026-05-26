import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import { revalidatePath } from 'next/cache'
import {
  CollectionConfig,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import type { EventType } from '@/payload-types'

const revalidateEventTypes: CollectionAfterChangeHook<EventType> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  payload.logger.info(
    `Revalidating all pages — event type ${doc.id} ("${doc.name}") changed`,
  )
  revalidatePath('/', 'layout')

  return doc
}

const revalidateEventTypesOnDelete: CollectionAfterDeleteHook<EventType> = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  payload.logger.info(`Revalidating all pages — event type ${doc.id} was deleted`)
  revalidatePath('/', 'layout')

  return doc
}

export const EventTypes: CollectionConfig = {
  slug: 'event-types',
  labels: {
    singular: { en: 'Event Type', pl: 'Rodzaj eventu' },
    plural: { en: 'Event Types', pl: 'Rodzaje eventów' },
  },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    group: adminGroups.settings,
    defaultColumns: ['name', 'slug', 'isActive'],
    hidden: ({ user }) => !isClientRoleEqualOrHigher('admin', user),
    description: {
      en: 'Event types an offer can serve (wedding, corporate, etc.). Used by the offer wizard and the public listings filter.',
      pl: 'Rodzaje eventów, dla których oferta jest przeznaczona (wesele, event firmowy, itp.). Używane przez kreator oferty oraz filtr na publicznej liście ogłoszeń.',
    },
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isClientRoleEqualOrHigher('admin', user),
    update: ({ req: { user } }) => isClientRoleEqualOrHigher('admin', user),
    delete: ({ req: { user } }) => isClientRoleEqualOrHigher('admin', user),
  },
  hooks: {
    afterChange: [revalidateEventTypes],
    afterDelete: [revalidateEventTypesOnDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { en: 'Name', pl: 'Nazwa' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
        description: {
          en: "Unique identifier (e.g., 'wesele'). Used in the public URL filter `?rodzaj=`.",
          pl: "Unikalny identyfikator (np. 'wesele'). Używany w filtrze URL `?rodzaj=`.",
        },
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: { en: 'Icon', pl: 'Ikona' },
      admin: {
        description: {
          en: 'Optional icon image. Falls back to a Sparkles glyph when empty.',
          pl: 'Opcjonalna ikona. Gdy puste, wyświetlana jest domyślna ikona Sparkles.',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', pl: 'Opis' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      label: { en: 'Active', pl: 'Aktywny' },
      admin: {
        position: 'sidebar',
        description: {
          en: 'When unchecked, hidden from the wizard picker and the listings filter. Existing offers tagged with this type keep the tag.',
          pl: 'Po odznaczeniu znika z kreatora oferty i z filtra ogłoszeń. Istniejące oferty z tym rodzajem zachowują przypisanie.',
        },
      },
    },
  ],
}
