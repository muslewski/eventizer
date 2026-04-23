import { z } from 'zod'

export const offerSchema = z
  .object({
    title: z.string().min(1, 'Tytuł jest wymagany').max(150, 'Tytuł jest za długi'),
    category: z.string().min(1, 'Kategoria jest wymagana'),
    shortDescription: z.string().max(500, 'Maksymalnie 500 znaków').optional().default(''),
    hasPriceRange: z.boolean().default(false),
    price: z.number().min(0).optional(),
    priceFrom: z.number().min(0).optional(),
    priceTo: z.number().min(0).optional(),
    serviceRadius: z.number().min(1).max(500).default(50),
    address: z.string().min(1, 'Adres jest wymagany'),
    city: z.string().optional().default(''),
    lat: z.number().optional(),
    lng: z.number().optional(),
    phone: z
      .string()
      .min(1, 'Telefon jest wymagany')
      .refine(
        (v) =>
          // Accepts formats like: 123456789, 123 456 789, 123-456-789,
          // +48 123 456 789, 0048123456789, +48123-456-789.
          /^(?:\+?48[\s-]?|0048[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/.test(v.trim()),
        { message: 'Nieprawidłowy numer telefonu (np. +48 123 456 789)' },
      ),
    email: z
      .string()
      .min(1, 'Email jest wymagany')
      .email('Nieprawidłowy adres email'),
    website: z
      .string()
      .optional()
      .default('')
      .refine((v) => !v || /^https:\/\//i.test(v), {
        message: 'Adres musi zaczynać się od https://',
      }),
    facebook: z.string().optional().default(''),
    instagram: z.string().optional().default(''),
    tiktok: z.string().optional().default(''),
    linkedin: z.string().optional().default(''),
    videoAspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasPriceRange) {
      if (!data.priceFrom && !data.priceTo) {
        ctx.addIssue({
          code: 'custom',
          path: ['priceFrom'],
          message: 'Podaj przynajmniej jedną wartość (od lub do)',
        })
      }
      if (data.priceFrom && data.priceTo && data.priceFrom > data.priceTo) {
        ctx.addIssue({
          code: 'custom',
          path: ['priceTo'],
          message: 'Cena do musi być większa od ceny od',
        })
      }
    } else {
      if (!data.price) {
        ctx.addIssue({
          code: 'custom',
          path: ['price'],
          message: 'Cena jest wymagana',
        })
      }
    }
  })

export type OfferFormData = z.infer<typeof offerSchema>

// Per-step schemas for validation
export const stepSchemas = [
  // Step 1: Basic info
  z.object({
    title: z.string().min(1, 'Tytuł jest wymagany').max(150, 'Tytuł jest za długi'),
    category: z.string().min(1, 'Kategoria jest wymagana'),
    shortDescription: z.string().max(500, 'Maksymalnie 500 znaków').optional().default(''),
  }),
  // Step 2: Pricing & Location
  z
    .object({
      hasPriceRange: z.boolean().default(false),
      price: z.number().min(0).optional(),
      priceFrom: z.number().min(0).optional(),
      priceTo: z.number().min(0).optional(),
      serviceRadius: z.number().min(1).max(500).default(50),
      address: z.string().min(1, 'Adres jest wymagany'),
    })
    .superRefine((data, ctx) => {
      if (data.hasPriceRange) {
        if (!data.priceFrom && !data.priceTo) {
          ctx.addIssue({
            code: 'custom',
            path: ['priceFrom'],
            message: 'Podaj przynajmniej jedną wartość (od lub do)',
          })
        }
        if (data.priceFrom && data.priceTo && data.priceFrom > data.priceTo) {
          ctx.addIssue({
            code: 'custom',
            path: ['priceTo'],
            message: 'Cena do musi być większa od ceny od',
          })
        }
      } else {
        if (!data.price) {
          ctx.addIssue({
            code: 'custom',
            path: ['price'],
            message: 'Cena jest wymagana',
          })
        }
      }
    }),
  // Step 3: Media — file uploads validated separately
  z.object({}),
  // Step 4: Description — content validated separately
  z.object({}),
  // Step 5: Summary — no additional validation
  z.object({}),
]
