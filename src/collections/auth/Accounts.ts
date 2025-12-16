import { adminOrHigher, adminOrHigherOrSelf, moderatorOrHigherOrSelf } from '@/access'
import { isClientRoleEqual } from '@/access/utilities'
import { adminGroups } from '@/lib/adminGroups'
import type { CollectionConfig } from 'payload'

export const Accounts: CollectionConfig = {
  slug: 'user-accounts',
  labels: {
    singular: {
      en: 'Account',
      pl: 'Konto',
    },
    plural: {
      en: 'Accounts',
      pl: 'Konta',
    },
  },
  admin: {
    group: adminGroups.auth,
    hidden: ({ user }) => !isClientRoleEqual('admin', user),
  },
  access: {
    read: adminOrHigherOrSelf(),
    update: adminOrHigherOrSelf(), // only admin or user can update its account
    delete: adminOrHigherOrSelf(), // only admin or user can delete its account
    create: () => false, // everyone can create new account
  },
  fields: [
    {
      name: 'userId',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: {
        en: 'User ID',
        pl: 'ID Użytkownika',
      },
    },
    {
      name: 'accountId',
      type: 'text',
      required: true,
      label: {
        en: 'Account ID',
        pl: 'ID Konta',
      },
    },
    {
      name: 'providerId',
      type: 'text',
      required: true,
      index: true,
      label: {
        en: 'Provider ID',
        pl: 'ID Dostawcy',
      },
    },
    {
      name: 'accessToken',
      type: 'text',
      label: {
        en: 'Access Token',
        pl: 'Token Dostępu',
      },
    },
    {
      name: 'refreshToken',
      type: 'text',
      label: {
        en: 'Refresh Token',
        pl: 'Token Odświeżania',
      },
    },
    {
      name: 'accessTokenExpiresAt',
      type: 'date',
      label: {
        en: 'Access Token Expires At',
        pl: 'Token Dostępu Wygasa',
      },
    },
    {
      name: 'refreshTokenExpiresAt',
      type: 'date',
      label: {
        en: 'Refresh Token Expires At',
        pl: 'Token Odświeżania Wygasa',
      },
    },
    {
      name: 'scope',
      type: 'text',
      label: {
        en: 'Scope',
        pl: 'Zakres',
      },
    },
    {
      name: 'idToken',
      type: 'text',
      label: {
        en: 'ID Token',
        pl: 'Token ID',
      },
    },
    {
      name: 'password',
      type: 'text',
      label: {
        en: 'Password',
        pl: 'Hasło',
      },
    },
  ],
}
