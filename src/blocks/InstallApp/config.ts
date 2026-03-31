import type { Block } from 'payload'

export const InstallApp: Block = {
  slug: 'installApp',
  interfaceName: 'InstallAppBlock',
  labels: {
    singular: {
      en: 'Install App',
      pl: 'Zainstaluj aplikację',
    },
    plural: {
      en: 'Install App Blocks',
      pl: 'Bloki instalacji aplikacji',
    },
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      defaultValue: 'Aplikacja mobilna',
      required: true,
      label: {
        en: 'Section Label',
        pl: 'Etykieta sekcji',
      },
      admin: {
        description: {
          en: 'Small uppercase label displayed above the heading (mobile view)',
          pl: 'Mała etykieta wyświetlana nad nagłówkiem (widok mobilny)',
        },
      },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      defaultValue: 'Twoje wydarzenia, jedno dotknięcie',
      required: true,
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Zainstaluj Eventizer na telefonie, by mieć natychmiastowy dostęp. Bez app store.',
      required: true,
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'iosButtonLabel',
      type: 'text',
      localized: true,
      defaultValue: 'iPhone',
      required: true,
      label: {
        en: 'iOS Button Label',
        pl: 'Tekst przycisku iOS',
      },
    },
    {
      name: 'androidButtonLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Android',
      required: true,
      label: {
        en: 'Android Button Label',
        pl: 'Tekst przycisku Android',
      },
    },
    {
      name: 'qrLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Aplikacja mobilna',
      required: true,
      label: {
        en: 'QR Section Label',
        pl: 'Etykieta sekcji QR',
      },
      admin: {
        description: {
          en: 'Small uppercase label displayed above the heading (desktop view)',
          pl: 'Mała etykieta wyświetlana nad nagłówkiem (widok desktopowy)',
        },
      },
    },
    {
      name: 'qrHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Pobierz aplikację na telefon',
      required: true,
      label: {
        en: 'QR Heading',
        pl: 'Nagłówek QR',
      },
    },
    {
      name: 'qrDescription',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Zeskanuj kod QR aparatem telefonu, aby zainstalować Eventizer.',
      required: true,
      label: {
        en: 'QR Description',
        pl: 'Opis QR',
      },
    },
    {
      name: 'iosDialogTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Zainstaluj na iPhonie',
      required: true,
      label: {
        en: 'iOS Dialog Title',
        pl: 'Tytuł okna iOS',
      },
    },
    {
      name: 'iosSteps',
      type: 'array',
      localized: true,
      required: true,
      minRows: 1,
      maxRows: 10,
      label: {
        en: 'iOS Installation Steps',
        pl: 'Kroki instalacji iOS',
      },
      admin: {
        description: {
          en: 'Step-by-step instructions for adding to home screen on iOS Safari',
          pl: 'Instrukcje krok po kroku dla dodania do ekranu głównego na iOS Safari',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: {
            en: 'Step Text',
            pl: 'Tekst kroku',
          },
        },
      ],
      defaultValue: [
        { text: 'Kliknij przycisk Udostępnij (\u2B06) na dole Safari' },
        { text: 'Przewiń w dół i kliknij "Dodaj do ekranu głównego"' },
        { text: 'Kliknij "Dodaj" w prawym górnym rogu' },
      ],
    },
    {
      name: 'androidDialogTitle',
      type: 'text',
      localized: true,
      defaultValue: 'Zainstaluj na Androidzie',
      required: true,
      label: {
        en: 'Android Dialog Title',
        pl: 'Tytuł okna Android',
      },
    },
    {
      name: 'androidSteps',
      type: 'array',
      localized: true,
      required: true,
      minRows: 1,
      maxRows: 10,
      label: {
        en: 'Android Installation Steps',
        pl: 'Kroki instalacji Android',
      },
      admin: {
        description: {
          en: 'Step-by-step instructions for adding to home screen on Android',
          pl: 'Instrukcje krok po kroku dla dodania do ekranu głównego na Android',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
          label: {
            en: 'Step Text',
            pl: 'Tekst kroku',
          },
        },
      ],
      defaultValue: [
        { text: 'Kliknij przycisk menu (\u22EE) w prawym górnym rogu przeglądarki' },
        { text: 'Kliknij "Dodaj do ekranu głównego" lub "Zainstaluj aplikację"' },
        { text: 'Kliknij "Dodaj", aby potwierdzić' },
      ],
    },
    {
      name: 'doneMessage',
      type: 'text',
      localized: true,
      defaultValue: 'To wszystko! Eventizer pojawi się na ekranie głównym.',
      required: true,
      label: {
        en: 'Done Message',
        pl: 'Wiadomość końcowa',
      },
      admin: {
        description: {
          en: 'Confirmation text shown below the steps in the dialog',
          pl: 'Tekst potwierdzenia wyświetlany pod krokami w oknie dialogowym',
        },
      },
    },
  ],
}
