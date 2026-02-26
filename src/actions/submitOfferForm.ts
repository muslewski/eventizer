'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { auth } from '@/auth/auth'
import { isExpandedDoc } from '@/lib/isExpandedDoc'
import type { User } from '@/payload-types'
import { sendFormConfirmationToClient, sendFormNotificationToProvider } from '@/auth/email/sendEmail'

export type FormType = 'order' | 'question' | 'problem'

export interface SubmitOfferFormInput {
  offerId: string | number
  type: FormType
  senderName: string
  senderEmail: string
  message: string
}

export interface SubmitOfferFormResult {
  success: boolean
  error?: string
}

export async function submitOfferForm(
  input: SubmitOfferFormInput,
): Promise<SubmitOfferFormResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return { success: false, error: 'Musisz być zalogowany, aby wysłać wiadomość.' }
    }

    const payload = await getPayload({ config })

    // Fetch offer with provider data
    const offer = await payload.findByID({
      collection: 'offers',
      id: input.offerId,
      depth: 1,
      overrideAccess: true,
    })

    if (!offer) {
      return { success: false, error: 'Oferta nie istnieje.' }
    }

    const provider = isExpandedDoc<User>(offer.user) ? offer.user : null
    const providerEmail = provider?.email ?? null
    const providerName = provider?.name ?? 'Usługodawca'

    if (!providerEmail) {
      return { success: false, error: 'Nie można dostarczyć wiadomości — brak emaila usługodawcy.' }
    }

    // Persist to DB
    await payload.create({
      collection: 'submitted-forms',
      data: {
        type: input.type,
        status: 'new',
        senderName: input.senderName,
        senderEmail: input.senderEmail,
        senderUserId: String(session.user.id),
        message: input.message,
        offer: offer.id,
        offerTitle: offer.title,
        provider: provider!.id,
        providerEmail,
      },
      overrideAccess: true,
    })

    // Email to client
    sendFormConfirmationToClient({
      to: input.senderEmail,
      senderName: input.senderName,
      offerTitle: offer.title,
      type: input.type,
    })

    // Email to provider
    sendFormNotificationToProvider({
      to: providerEmail,
      providerName,
      senderName: input.senderName,
      senderEmail: input.senderEmail,
      offerTitle: offer.title,
      type: input.type,
      message: input.message,
    })

    return { success: true }
  } catch (err) {
    console.error('[submitOfferForm]', err)
    return { success: false, error: 'Wystąpił błąd. Spróbuj ponownie.' }
  }
}
