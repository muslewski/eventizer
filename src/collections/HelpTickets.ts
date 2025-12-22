import { adminGroups } from '@/lib/adminGroups'
import { CollectionConfig } from 'payload'
import { moderatorOrHigher, moderatorOrHigherOrSelf, publicAccess } from '@/access'
import { fieldRoleOrHigher, isClientRoleEqualOrHigher } from '@/access/utilities'

export const HelpTickets: CollectionConfig = {
  slug: 'help-tickets',
  labels: {
    singular: {
      en: 'Help Ticket',
      pl: 'Zgłoszenie Pomocy',
    },
    plural: {
      en: 'Help Tickets',
      pl: 'Zgłoszenia Pomocy',
    },
  },
  admin: {
    group: adminGroups.help,
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt', 'isSolved', 'user'],
  },
  access: {
    read: ({ req: { user } }) => {
      // If no user, allow public read (for viewing images)
      if (!user) return true

      // Moderators and above can see all
      if (isClientRoleEqualOrHigher('moderator', user)) return true

      // Regular users only see their own tickets
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: publicAccess,
    update: moderatorOrHigherOrSelf('user'), // mods, admins, and owners
    delete: moderatorOrHigher,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: {
        en: 'Title',
        pl: 'Tytuł',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: {
        en: 'Email',
        pl: 'Email',
      },
      admin: {
        description: {
          pl: 'Adres email, na który zostanie wysłana odpowiedź.',
          en: 'The email address where the response will be sent.',
        },
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: {
        en: 'User',
        pl: 'Użytkownik',
      },
      access: {
        read: fieldRoleOrHigher('moderator'),
        update: fieldRoleOrHigher('admin'),
      },
      defaultValue: ({ req }) => req.user?.id,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isSolved',
      type: 'checkbox',
      label: {
        en: 'Solved',
        pl: 'Czy rozwiązane',
      },
      defaultValue: false,
      required: true,
      access: {
        update: fieldRoleOrHigher('moderator'),
        create: fieldRoleOrHigher('moderator'),
      },
      admin: {
        position: 'sidebar',
        description: {
          pl: 'Moderatorzy zaznaczają to pole, gdy zgłoszenie zostanie rozwiązane.',
          en: 'Moderators check this box when the ticket will be resolved.',
        },
      },
    },
  ],
}
