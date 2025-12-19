import { enTranslations } from '@payloadcms/translations/languages/en'
import type { NestedKeysStripped } from '@payloadcms/translations'

export const customTranslations = {
  en: {
    dashboard: {
      welcomeTitle: 'Welcome Back',
      welcomeSubtitleAdmin: 'Full system control and administration',
      welcomeSubtitleModerator: 'Review content and manage the community',
      welcomeSubtitleServiceProvider: 'Manage your services and bookings',
      welcomeSubtitleClient: 'Discover and book amazing services',
    },
    general: {
      payloadSettings: 'Application Settings',
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
      welcomeSubtitleAdmin: 'Pełna kontrola i administracja systemu',
      welcomeSubtitleModerator: 'Przeglądaj treści i zarządzaj społecznością',
      welcomeSubtitleServiceProvider: 'Zarządzaj swoimi usługami i rezerwacjami',
      welcomeSubtitleClient: 'Odkrywaj i rezerwuj niesamowite usługi',
    },
    general: {
      payloadSettings: 'Ustawienia aplikacji',
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
