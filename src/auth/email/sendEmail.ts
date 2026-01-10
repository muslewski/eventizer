import { EmailPasswordResetTemplate, EmailVerificationTemplate } from '@/auth/email/email-template'
import React from 'react'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  text: string
  react?: React.ReactNode
  html?: string
}

export function sendEmail({ to, subject, text, html, react }: SendEmailParams): void {
  if (!process.env.EMAIL_FROM_ADDRESS) {
    throw new Error('EMAIL_FROM_ADDRESS is not set in environment variables.')
  }
  const from = process.env.EMAIL_FROM_ADDRESS

  // Fire and forget - don't await to prevent timing attacks
  resend.emails
    .send({
      from,
      to,
      subject,
      text,
      html,
      react,
    })
    .catch((error) => {
      console.error('Failed to send email:', error)
    })
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
