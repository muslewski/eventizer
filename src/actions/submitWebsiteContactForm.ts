'use server'

import {
  sendWebsiteFormConfirmationToClient,
  sendWebsiteFormInternalNotification,
} from '@/auth/email/sendEmail'

export type WebsiteFormType = 'organization' | 'question' | 'service-problem'

export interface SubmitWebsiteContactFormInput {
  type: WebsiteFormType
  senderName: string
  senderEmail: string
  message: string
  // Organization-only extras
  eventDate?: string
  eventLocation?: string
  eventGuestCount?: string
}

export interface SubmitWebsiteContactFormResult {
  success: boolean
  error?: string
}

export async function submitWebsiteContactForm(
  input: SubmitWebsiteContactFormInput,
): Promise<SubmitWebsiteContactFormResult> {
  try {
    // Confirmation to the sender
    sendWebsiteFormConfirmationToClient({
      to: input.senderEmail,
      senderName: input.senderName,
      type: input.type,
    })

    // Internal notification to the team
    sendWebsiteFormInternalNotification({
      senderName: input.senderName,
      senderEmail: input.senderEmail,
      type: input.type,
      message: input.message,
      eventDate: input.eventDate,
      eventLocation: input.eventLocation,
      eventGuestCount: input.eventGuestCount,
    })

    return { success: true }
  } catch (err) {
    console.error('[submitWebsiteContactForm]', err)
    return { success: false, error: 'Wystąpił błąd. Spróbuj ponownie.' }
  }
}
