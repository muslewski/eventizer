import { z } from 'zod'

export const planChangeSchema = z.object({
  selectedKind: z.enum(['single', 'multi']).optional(),
  selectedCategoryPath: z.string().optional(),
  selectedTierSlug: z.enum(['multi', 'agency']).optional(),
  selectedPriceId: z.string().optional(),
  selectedIntervalKey: z.string().optional(), // e.g. 'month/1', 'year/1'
  keepScheduledCancel: z.boolean().default(true),
})

export type WizardFormData = z.infer<typeof planChangeSchema>
