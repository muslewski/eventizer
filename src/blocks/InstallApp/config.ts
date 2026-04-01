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
      name: 'sectionHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Zainstaluj Eventizer',
      required: true,
      label: {
        en: 'Section Heading',
        pl: 'Nagłówek sekcji',
      },
      admin: {
        description: {
          en: 'Main heading displayed above the install app block',
          pl: 'Główny nagłówek wyświetlany nad blokiem instalacji aplikacji',
        },
      },
    },
    {
      name: 'sectionDescription',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Dodaj aplikację do ekranu głównego i korzystaj z niej jak z natywnej aplikacji — bez pobierania ze sklepu.',
      required: true,
      label: {
        en: 'Section Description',
        pl: 'Opis sekcji',
      },
      admin: {
        description: {
          en: 'Supporting text displayed below the section heading',
          pl: 'Tekst pomocniczy wyświetlany pod nagłówkiem sekcji',
        },
      },
    },
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
      admin: {
        description: {
          en: 'Main heading text displayed in the install app card',
          pl: 'Główny tekst nagłówka wyświetlany w karcie instalacji aplikacji',
        },
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
      admin: {
        description: {
          en: 'Supporting text displayed below the heading (mobile view)',
          pl: 'Tekst pomocniczy wyświetlany pod nagłówkiem (widok mobilny)',
        },
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
      admin: {
        description: {
          en: 'Text on the iPhone install button',
          pl: 'Tekst na przycisku instalacji iPhone',
        },
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
      admin: {
        description: {
          en: 'Text on the Android install button',
          pl: 'Tekst na przycisku instalacji Android',
        },
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
      admin: {
        description: {
          en: 'Heading text displayed next to the QR code (desktop view)',
          pl: 'Tekst nagłówka wyświetlany obok kodu QR (widok desktopowy)',
        },
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
      admin: {
        description: {
          en: 'Supporting text displayed below the QR heading (desktop view)',
          pl: 'Tekst pomocniczy wyświetlany pod nagłówkiem QR (widok desktopowy)',
        },
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
      admin: {
        description: {
          en: 'Title of the iOS installation instructions dialog',
          pl: 'Tytuł okna dialogowego z instrukcjami instalacji iOS',
        },
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
      admin: {
        description: {
          en: 'Title of the Android installation instructions dialog',
          pl: 'Tytuł okna dialogowego z instrukcjami instalacji Android',
        },
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
