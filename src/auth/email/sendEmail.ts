import {
  EmailPasswordResetTemplate,
  EmailVerificationTemplate,
  EmailFormConfirmationToClientTemplate,
  EmailFormNotificationToProviderTemplate,
  EmailWebsiteFormClientConfirmationTemplate,
  EmailWebsiteFormInternalNotificationTemplate,
  type FormType,
} from '@/auth/email/email-template'
import type { WebsiteFormType } from '@/actions/submitWebsiteContactForm'
import React from 'react'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1500

interface SendEmailParams {
  to: string
  subject: string
  text: string
  react?: React.ReactNode
  html?: string
}

async function sendEmailWithRetry(
  params: Omit<SendEmailParams, 'to'> & { from: string; to: string },
  attempt = 1,
): Promise<void> {
  try {
    const { error } = await resend.emails.send(params)
    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(
        `[sendEmail] Attempt ${attempt} failed for ${params.to}. Retrying in ${RETRY_DELAY_MS}ms…`,
        error,
      )
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
      return sendEmailWithRetry(params, attempt + 1)
    }
    console.error(
      `[sendEmail] All ${MAX_RETRIES} attempts failed for ${params.to}:`,
      error,
    )
  }
}

export function sendEmail({ to, subject, text, html, react }: SendEmailParams): void {
  if (!process.env.EMAIL_FROM_ADDRESS) {
    throw new Error('EMAIL_FROM_ADDRESS is not set in environment variables.')
  }
  const from = process.env.EMAIL_FROM_ADDRESS

  // Fire and forget (preserves timing-safe auth responses) but with internal retry
  void sendEmailWithRetry({ from, to, subject, text, html, react })
}

export function sendVerificationEmail(
  user: { email: string; name?: string | null },
  url: string,
): void {
  console.log('SEND VERIFICATION 2')

  sendEmail({
    to: user.email,
    subject: 'Zweryfikuj swój email',
    react: EmailVerificationTemplate({ userName: user.name || 'Użytkowniku', url }),
    text: `Witaj ${user.name || 'Użytkowniku'},\n\nKliknij poniższy link, aby zweryfikować swój adres email:\n\n${url}\n\nEventizer`,
  })
}

export function sendResetPasswordEmail(
  user: { email: string; name?: string | null },
  url: string,
): void {
  sendEmail({
    to: user.email,
    subject: 'Resetuj swoje hasło',
    react: EmailPasswordResetTemplate({ userName: user.name || 'Użytkowniku', url }),
    text: `Witaj ${user.name || 'Użytkowniku'},\n\nKliknij poniższy link, aby zresetować swoje hasło:\n\n${url}\n\nEventizer`,
  })
}

interface FormConfirmationParams {
  to: string
  senderName: string
  offerTitle: string
  type: FormType
}

export function sendFormConfirmationToClient({
  to,
  senderName,
  offerTitle,
  type,
}: FormConfirmationParams): void {
  sendEmail({
    to,
    subject: 'Twoja wiadomość została wysłana ✅',
    react: EmailFormConfirmationToClientTemplate({ senderName, offerTitle, type }),
    text: `Cześć ${senderName},\n\nTwoja wiadomość dotycząca oferty „${offerTitle}" została wysłana do usługodawcy.\n\nUsługodawca wkrótce się z Tobą skontaktuje.\n\nEventizer`,
  })
}

interface FormNotificationParams {
  to: string
  providerName: string
  senderName: string
  senderEmail: string
  offerTitle: string
  type: FormType
  message: string
}

export function sendFormNotificationToProvider({
  to,
  providerName,
  senderName,
  senderEmail,
  offerTitle,
  type,
  message,
}: FormNotificationParams): void {
  sendEmail({
    to,
    subject: `Nowe zapytanie od klienta: ${senderName}`,
    react: EmailFormNotificationToProviderTemplate({
      providerName,
      senderName,
      senderEmail,
      offerTitle,
      type,
      message,
    }),
    text: `Cześć ${providerName},\n\nOtrzymałeś nowe zapytanie od klienta ${senderName} (${senderEmail}) dotyczące oferty „${offerTitle}".\n\nWiadomość:\n${message}\n\nEventizer`,
  })
}
// ─── Website contact form ───────────────────────────────────────────────────────────────────────────────

interface WebsiteFormConfirmationParams {
  to: string
  senderName: string
  type: WebsiteFormType
}

export function sendWebsiteFormConfirmationToClient({
  to,
  senderName,
  type,
}: WebsiteFormConfirmationParams): void {
  sendEmail({
    to,
    subject: 'Twoje zgłoszenie zostało przesłane ✅',
    react: EmailWebsiteFormClientConfirmationTemplate({ senderName, type }),
    text: `Cześć ${senderName},\n\nTwoje zgłoszenie zostało przez nas odebrane. Wrócimy do Ciebie najszybciej jak to możliwe.\n\nEventizer`,
  })
}

interface WebsiteFormInternalParams {
  senderName: string
  senderEmail: string
  type: WebsiteFormType
  message: string
  eventDate?: string
  eventLocation?: string
  eventGuestCount?: string
}

export function sendWebsiteFormInternalNotification(params: WebsiteFormInternalParams): void {
  // TODO: change to eventizer inbox once we have our own email address
  const INTERNAL_INBOX = 'studio@sightstorm.pl'

  sendEmail({
    to: INTERNAL_INBOX,
    subject: `[Eventizer] Nowe zgłoszenie: ${params.senderName}`,
    react: EmailWebsiteFormInternalNotificationTemplate(params),
    text: `Nowe zgłoszenie ze strony eventizer.pl\n\nTyp: ${params.type}\nNadawca: ${params.senderName} (${params.senderEmail})\n\nWiadomość:\n${params.message}`,
  })
}