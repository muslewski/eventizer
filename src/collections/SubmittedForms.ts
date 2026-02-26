import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'
import { adminOrHigher, moderatorOrHigher } from '@/access'
import { checkRole, getRolesAtOrAbove } from '@/access/utilities'

export const SubmittedForms: CollectionConfig = {
  slug: 'submitted-forms',
  labels: {
    singular: {
      en: 'Submitted Form',
      pl: 'Formularz Kontaktowy',
    },
    plural: {
      en: 'Submitted Forms',
      pl: 'Formularze Kontaktowe',
    },
  },
  admin: {
    group: adminGroups.help,
    useAsTitle: 'senderName',
    defaultColumns: ['senderName', 'senderEmail', 'type', 'offerTitle', 'status', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => {
      if (!user) return false
      // Moderators and above can see all
      if (checkRole(getRolesAtOrAbove('moderator'), user)) return true
      // Senders and providers see their own submissions
      return {
        senderUserId: { equals: String(user.id) },
      } as any
    },
    update: moderatorOrHigher,
    delete: adminOrHigher,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      label: {
        en: 'Form Type',
        pl: 'Typ Formularza',
      },
      options: [
        { label: { en: 'Order', pl: 'Zamówienie' }, value: 'order' },
        { label: { en: 'Question', pl: 'Pytanie' }, value: 'question' },
        { label: { en: 'Problem', pl: 'Problem' }, value: 'problem' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: {
        en: 'Status',
        pl: 'Status',
      },
      options: [
        { label: { en: 'New', pl: 'Nowy' }, value: 'new' },
        { label: { en: 'Read', pl: 'Przeczytany' }, value: 'read' },
        { label: { en: 'Replied', pl: 'Odpowiedź Wysłana' }, value: 'replied' },
      ],
    },
    {
      name: 'senderName',
      type: 'text',
      required: true,
      label: {
        en: 'Sender Name',
        pl: 'Imię i nazwisko nadawcy',
      },
    },
    {
      name: 'senderEmail',
      type: 'email',
      required: true,
      label: {
        en: 'Sender Email',
        pl: 'Email nadawcy',
      },
    },
    {
      name: 'senderUserId',
      type: 'text',
      label: {
        en: 'Sender User ID',
        pl: 'ID Użytkownika Nadawcy',
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      label: {
        en: 'Message',
        pl: 'Wiadomość',
      },
    },
    {
      name: 'offer',
      type: 'relationship',
      relationTo: 'offers',
      required: true,
      label: {
        en: 'Offer',
        pl: 'Oferta',
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'offerTitle',
      type: 'text',
      required: true,
      label: {
        en: 'Offer Title (snapshot)',
        pl: 'Tytuł oferty (migawka)',
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'provider',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: {
        en: 'Service Provider',
        pl: 'Usługodawca',
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'providerEmail',
      type: 'email',
      required: true,
      label: {
        en: 'Provider Email (snapshot)',
        pl: 'Email usługodawcy (migawka)',
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
