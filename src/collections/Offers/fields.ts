import type { Field } from 'payload'
import { fieldRoleOrHigher, isClientRoleEqualOrHigher } from '@/access/utilities'
import { offerLexical } from '@/fields/offerLexical'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

export const offersFields: Field[] = [
  // Admin fields
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
    name: 'title',
    type: 'text',
    required: true,
    defaultValue: () => {
      const now = new Date()
      const day = now.getDate().toString().padStart(2, '0')
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      const hour = now.getHours().toString().padStart(2, '0')
      const minute = now.getMinutes().toString().padStart(2, '0')
      const seconds = now.getSeconds().toString().padStart(2, '0')
      return `Nowa oferta ${day}.${month} ${hour}:${minute}:${seconds}`
    },
    // localized: true,
    label: {
      en: 'Title',
      pl: 'Tytuł',
    },
  },
  {
    name: 'category',
    type: 'text',
    required: true,
    label: {
      en: 'Category',
      pl: 'Kategoria',
    },
    admin: {
      components: {
        Field: '/components/payload/fields/offerCategorySelect',
      },
      description: {
        en: 'Select the category for this offer based on your subscription plan.',
        pl: 'Wybierz kategorię dla tej oferty na podstawie Twojego planu subskrypcji.',
      },
    },
  },

  {
    type: 'checkbox',
    name: 'hasPriceRange',
    label: {
      en: 'Has Price Range',
      pl: 'Posiada Zakres Cenowy',
    },
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description: {
        en: 'Check if this offer has a price range instead of a fixed price.',
        pl: 'Zaznacz, jeśli ta oferta posiada zakres cenowy zamiast stałej ceny.',
      },
    },
  },
  {
    type: 'number',
    name: 'price',
    label: {
      en: 'Price (PLN)',
      pl: 'Cena (PLN)',
    },
    required: true,
    min: 0,
    admin: {
      position: 'sidebar',
      condition: (data, siblingData) => !siblingData?.hasPriceRange,
      description: {
        en: 'Set the price for this offer in Polish Zloty (PLN).',
        pl: 'Ustaw cenę tej oferty w polskich złotych (PLN).',
      },
    },
  },
  {
    type: 'number',
    name: 'priceFrom',
    label: {
      en: 'Price From (PLN)',
      pl: 'Cena Od (PLN)',
    },
    min: 0,
    admin: {
      position: 'sidebar',
      condition: (data, siblingData) => Boolean(siblingData?.hasPriceRange),
    },
  },
  {
    type: 'number',
    name: 'priceTo',
    label: {
      en: 'Price To (PLN)',
      pl: 'Cena Do (PLN)',
    },
    min: 0,
    admin: {
      position: 'sidebar',
      condition: (data, siblingData) => Boolean(siblingData?.hasPriceRange),
    },
  },

  // Display-friendly category name (auto-populated)
  {
    name: 'categoryName',
    type: 'text',
    label: {
      en: 'Category Name',
      pl: 'Nazwa Kategorii',
    },
    admin: {
      readOnly: true,
      position: 'sidebar',
      condition: (data, siblingData, { user }) => {
        return isClientRoleEqualOrHigher('moderator', user)
      },
    },
  },
  // Category slug (auto-populated from category path)
  {
    name: 'categorySlug',
    type: 'text',
    label: {
      en: 'Category Slug',
      pl: 'Slug Kategorii',
    },
    admin: {
      readOnly: true,
      position: 'sidebar',
      condition: (data, siblingData, { user }) => {
        return isClientRoleEqualOrHigher('moderator', user)
      },
    },
  },
  {
    type: 'tabs',
    tabs: [
      {
        fields: [
          // Add instruction - instrukcja przejrzystej oferty
          {
            name: 'content',
            type: 'richText',
            editor: offerLexical,
            label: {
              en: 'Main Content',
              pl: 'Treść',
            },
            admin: {
              description: {
                pl: 'Dodaj szczegółowy opis swojej oferty.',
                en: 'Add a detailed description of your offer.',
              },
              components: {
                afterInput: ['/components/payload/fields/offerContentInstructions'],
              },
            },
            required: true,
          },
          {
            name: 'shortDescription',
            type: 'textarea',
            label: {
              en: 'Short Description',
              pl: 'Krótki Opis',
            },
            admin: {
              description: {
                en: 'A brief summary of the offer, shown in listings.',
                pl: 'Krótki opis oferty, wyświetlany na listach.',
              },
            },
            required: true,
          },
        ],
        label: {
          en: 'Main Content',
          pl: 'Główna Treść',
        },
      },
      {
        label: {
          en: 'Media',
          pl: 'Media',
        },
        fields: [
          {
            name: 'mainImage',
            type: 'upload',
            relationTo: 'offer-uploads',
            required: true,
            label: {
              en: 'Main Image',
              pl: 'Główne Zdjęcie',
            },
            admin: {
              components: {
                Cell: '/components/payload/fields/offerMainImageCell',
              },
              description: {
                en: 'Upload the main image representing your offer.',
                pl: 'Prześlij główne zdjęcie reprezentujące Twoją ofertę.',
              },
            },
          },
          {
            name: 'backgroundImage',
            type: 'upload',
            relationTo: 'offer-uploads',
            label: {
              en: 'Background Image',
              pl: 'Zdjęcie w Tle',
            },
            admin: {
              description: {
                en: 'This image will be displayed as a background on your offer page. It helps create a more immersive experience for your clients.',
                pl: 'To zdjęcie będzie wyświetlane jako tło na stronie Twojej oferty. Pomoże stworzyć bardziej angażujące doświadczenie dla Twoich klientów.',
              },
            },
          },
          {
            name: 'gallery',
            type: 'array',
            label: {
              en: 'Gallery',
              pl: 'Galeria',
            },
            admin: {
              description: {
                en: 'Add additional images for your offer slider/gallery.',
                pl: 'Dodaj dodatkowe zdjęcia do slidera/galerii oferty.',
              },
              initCollapsed: true,
            },
            labels: {
              singular: {
                en: 'Image',
                pl: 'Zdjęcie',
              },
              plural: {
                en: 'Images',
                pl: 'Zdjęcia',
              },
            },
            fields: [
              {
                name: 'image',
                type: 'upload',
                relationTo: 'offer-uploads',
                required: true,
                label: {
                  en: 'Image',
                  pl: 'Zdjęcie',
                },
              },
              {
                name: 'label',
                type: 'text',
                label: {
                  en: 'Label',
                  pl: 'Etykieta',
                },
                admin: {
                  description: {
                    en: 'Optional label displayed on the gallery slide.',
                    pl: 'Opcjonalna etykieta wyświetlana na slajdzie galerii.',
                  },
                },
              },
            ],
          },
          {
            name: 'video',
            type: 'upload',
            relationTo: 'offer-video-uploads',
            label: {
              en: 'Promotional Video',
              pl: 'Film Promocyjny',
            },
            admin: {
              description: {
                en: 'Upload a short promotional video for your offer. (max 50 MB, mp4 or webm)',
                pl: 'Prześlij krótki film promocyjny do swojej oferty. (maks. 50 MB, mp4 lub webm)',
              },
            },
          },
          {
            name: 'videoPreview',
            type: 'ui',
            admin: {
              components: {
                Field: '/components/payload/fields/offerVideoPreview',
              },
            },
          },
        ],
      },
      {
        label: {
          en: 'Contact Information',
          pl: 'Informacje kontaktowe',
        },
        fields: [
          {
            name: 'phone',
            type: 'text',
            label: {
              en: 'Phone Number',
              pl: 'Numer Telefonu',
            },
            admin: {
              description: {
                en: 'Phone number related to the offer.',
                pl: 'Numer telefonu związany z ofertą.',
              },
            },
          },
          {
            name: 'email',
            type: 'text',
            label: {
              en: 'Email',
              pl: 'Email',
            },
            admin: {
              description: {
                en: 'Email address related to the offer.',
                pl: 'Adres email związany z ofertą.',
              },
            },
          },
          {
            name: 'location',
            type: 'group',
            label: {
              en: 'Location',
              pl: 'Lokalizacja',
            },
            admin: {
              description: {
                en: 'Search for your address using Google Places autocomplete.',
                pl: 'Wyszukaj swój adres za pomocą autouzupełniania Google Places.',
              },
            },
            fields: [
              {
                name: 'address',
                type: 'text',
                required: true,
                label: {
                  en: 'Address',
                  pl: 'Adres',
                },
                admin: {
                  components: {
                    Field: '/components/payload/fields/locationPicker',
                  },
                },
              },
              {
                name: 'city',
                type: 'text',
                label: {
                  en: 'City',
                  pl: 'Miasto',
                },
                index: true,
                admin: {
                  readOnly: true,
                  condition: (data, siblingData, { user }) => {
                    return isClientRoleEqualOrHigher('moderator', user)
                  },
                },
              },
              {
                name: 'lat',
                type: 'number',
                label: {
                  en: 'Latitude',
                  pl: 'Szerokość geograficzna',
                },
                index: true,
                admin: {
                  readOnly: true,
                  step: 0.000001,
                  condition: (data, siblingData, { user }) => {
                    return isClientRoleEqualOrHigher('moderator', user)
                  },
                },
              },
              {
                name: 'lng',
                type: 'number',
                label: {
                  en: 'Longitude',
                  pl: 'Długość geograficzna',
                },
                index: true,
                admin: {
                  readOnly: true,
                  step: 0.000001,
                  condition: (data, siblingData, { user }) => {
                    return isClientRoleEqualOrHigher('moderator', user)
                  },
                },
              },
              {
                name: 'placeId',
                type: 'text',
                label: {
                  en: 'Google Place ID',
                  pl: 'Google Place ID',
                },
                admin: {
                  readOnly: true,
                  condition: (data, siblingData, { user }) => {
                    return isClientRoleEqualOrHigher('moderator', user)
                  },
                },
              },
              {
                name: 'serviceRadius',
                type: 'number',
                label: {
                  en: 'Service Radius (km)',
                  pl: 'Zasięg usługi (km)',
                },
                defaultValue: 50,
                min: 1,
                max: 500,
                required: true,
                admin: {
                  description: {
                    en: 'How far from your location are you willing to provide services? (in km)',
                    pl: 'Jak daleko od swojej lokalizacji jesteś w stanie świadczyć usługi? (w km)',
                  },
                },
              },
            ],
          },
          {
            name: 'socialMedia',
            type: 'group',
            label: {
              en: 'Social Media',
              pl: 'Media społecznościowe',
            },
            admin: {
              description: {
                en: 'Add your social media links to help clients find you. (optional)',
                pl: 'Dodaj linki do mediów społecznościowych, aby klienci mogli Cię łatwiej znaleźć. (opcjonalne)',
              },
            },
            fields: [
              {
                name: 'facebook',
                type: 'text',
                label: 'Facebook',
                admin: {
                  placeholder: 'https://facebook.com/...',
                },
              },
              {
                name: 'instagram',
                type: 'text',
                label: 'Instagram',
                admin: {
                  placeholder: 'https://instagram.com/...',
                },
              },
              {
                name: 'tiktok',
                type: 'text',
                label: 'TikTok',
                admin: {
                  placeholder: 'https://tiktok.com/@...',
                },
              },
              {
                name: 'linkedin',
                type: 'text',
                label: 'LinkedIn',
                admin: {
                  placeholder: 'https://linkedin.com/in/...',
                },
              },
            ],
          },
        ],
      },
      {
        name: 'meta',
        label: {
          pl: 'Pozycjonowanie w wyszukiwarkach',
          en: 'Search Engine Optimization',
        },
        fields: [
          OverviewField({
            titlePath: 'meta.title',
            descriptionPath: 'meta.description',
            imagePath: 'meta.image',
          }),
          MetaTitleField({
            hasGenerateFn: true,
            overrides: {
              localized: false,
            },
          }),
          MetaImageField({
            relationTo: 'offer-uploads',
            overrides: {
              localized: false,
            },
          }),

          MetaDescriptionField({
            overrides: {
              localized: false,
            },
          }),
          PreviewField({
            // if the `generateUrl` function is configured
            hasGenerateFn: true,

            // field paths to match the target field for data
            titlePath: 'meta.title',
            descriptionPath: 'meta.description',
          }),
        ],
      },
    ],
  },
  slugField({
    name: 'link',
    useAsSlug: 'title',
  }),
]
