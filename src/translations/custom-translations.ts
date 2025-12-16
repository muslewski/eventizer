import { enTranslations } from '@payloadcms/translations/languages/en'
import type { NestedKeysStripped } from '@payloadcms/translations'

export const customTranslations = {
  en: {
    dashboard: {
      welcomeTitle: 'Welcome Back',
      welcomeSubtitle: 'Manage your content efficiently',
    },
    avatar: {
      greeting: 'Hi,',
    },
    beforeNav: {
      yourRole: 'Your Role',
    },
  },
  pl: {
    dashboard: {
      welcomeTitle: 'Witaj ponownie',
      welcomeSubtitle: 'Zarządzaj swoimi treściami efektywnie',
    },
    avatar: {
      greeting: 'Cześć,',
    },
    beforeNav: {
      yourRole: 'Twoja rola',
    },
  },
}

export type CustomTranslationsObject = typeof customTranslations.en & typeof enTranslations
export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>
