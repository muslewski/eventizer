import type { Block } from 'payload'

export const ContactFormBlock: Block = {
  slug: 'contactForm',
  interfaceName: 'ContactFormBlock',
  labels: {
    singular: {
      en: 'Contact Form',
      pl: 'Formularz Kontaktowy',
    },
    plural: {
      en: 'Contact Forms',
      pl: 'Formularze Kontaktowe',
    },
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Skontaktuj się z nami',
      label: {
        en: 'Heading',
        pl: 'Nagłówek',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Wypełnij formularz, a my skontaktujemy się z Tobą najszybciej jak to możliwe.',
      label: {
        en: 'Description',
        pl: 'Opis',
      },
    },
    {
      name: 'organizationLabel',
      type: 'text',
      defaultValue: 'Organizacja eventu',
      label: {
        en: 'Organization option label',
        pl: 'Etykieta opcji: Organizacja',
      },
    },
    {
      name: 'organizationDescription',
      type: 'textarea',
      defaultValue:
        'Zorganizujemy dla Ciebie niezapomniany event — powiedz nam gdzie, kiedy, ilu gości i czego potrzebujesz, a zajmiemy się resztą.',
      label: {
        en: 'Organization option description',
        pl: 'Opis opcji: Organizacja',
      },
    },
  ],
}
