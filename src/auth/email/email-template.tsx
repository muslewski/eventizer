import { EmailTemplate } from '@daveyplate/better-auth-ui/server'

interface EmailVerificationTemplateProps {
  userName: string
  url: string
}

export function EmailVerificationTemplate({ userName, url }: EmailVerificationTemplateProps) {
  return EmailTemplate({
    action: 'Zweryfikuj swój email',
    content: (
      <>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>{`Cześć ${userName}! 👋`}</p>
        <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '8px' }}>
          Dziękujemy za rejestrację w <strong>Eventizer</strong> — platformie do zarządzania
          ogłoszeniami eventowymi.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
          Kliknij przycisk poniżej, aby zweryfikować swój adres email i aktywować konto.
          Link jest ważny przez <strong>24 godziny</strong>.
        </p>
      </>
    ),
    heading: 'Zweryfikuj swój email',
    siteName: 'Eventizer',
    baseUrl: 'https://eventizer.pl',
    url,
  })
}

export function EmailPasswordResetTemplate({ userName, url }: EmailVerificationTemplateProps) {
  return EmailTemplate({
    action: 'Resetuj swoje hasło',
    content: (
      <>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>{`Cześć ${userName}! 👋`}</p>
        <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '8px' }}>
          Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w{' '}
          <strong>Eventizer</strong>.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
          Kliknij przycisk poniżej, aby ustawić nowe hasło. Link jest ważny przez{' '}
          <strong>1 godzinę</strong>. Jeśli to nie Ty wysłałeś(-aś) tę prośbę, zignoruj
          tę wiadomość — Twoje konto pozostaje bezpieczne.
        </p>
      </>
    ),
    heading: 'Resetuj swoje hasło',
    siteName: 'Eventizer',
    baseUrl: 'https://eventizer.pl',
    url,
  })
}
