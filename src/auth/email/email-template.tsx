import { EmailTemplate } from '@daveyplate/better-auth-ui/server'

interface EmailVerificationTemplateProps {
  userName: string
  url: string
}

export type FormType = 'order' | 'question' | 'problem'

const formTypeLabels: Record<FormType, string> = {
  order: 'Zamówienie',
  question: 'Pytanie',
  problem: 'Zgłoszenie problemu',
}

interface FormConfirmationToClientProps {
  senderName: string
  offerTitle: string
  type: FormType
}

export function EmailFormConfirmationToClientTemplate({
  senderName,
  offerTitle,
  type,
}: FormConfirmationToClientProps) {
  return EmailTemplate({
    action: 'Wróć do Eventizer',
    content: (
      <>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>{`Cześć ${senderName}! 👋`}</p>
        <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '8px' }}>
          Twoja wiadomość (<strong>{formTypeLabels[type]}</strong>) dotycząca oferty{' '}
          <strong>„{offerTitle}"</strong> została pomyślnie wysłana do usługodawcy.
        </p>
        <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
          Usługodawca wkrótce się z Tobą skontaktuje. W razie pytań odwiedź{' '}
          <strong>Eventizer</strong>.
        </p>
      </>
    ),
    heading: 'Wiadomość wysłana! ✅',
    siteName: 'Eventizer',
    imageUrl: 'http://eventizer.pl/api/media/file/eventizer-icon-1.png',
    baseUrl: 'https://eventizer.pl',
    url: 'https://eventizer.pl',
  })
}

interface FormNotificationToProviderProps {
  providerName: string
  senderName: string
  senderEmail: string
  offerTitle: string
  type: FormType
  message: string
}

export function EmailFormNotificationToProviderTemplate({
  providerName,
  senderName,
  senderEmail,
  offerTitle,
  type,
  message,
}: FormNotificationToProviderProps) {
  return EmailTemplate({
    action: 'Przejdź do panelu',
    content: (
      <>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>{`Cześć ${providerName}! 👋`}</p>
        <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '8px' }}>
          Otrzymałeś nowe zapytanie (<strong>{formTypeLabels[type]}</strong>) ze strony{' '}
          <strong>Eventizer</strong> dotyczące Twojej oferty{' '}
          <strong>„{offerTitle}"</strong>.
        </p>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '8px', fontWeight: 600, width: '30%' }}>Klient:</td>
              <td style={{ padding: '8px' }}>{senderName}</td>
            </tr>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <td style={{ padding: '8px', fontWeight: 600 }}>Email klienta:</td>
              <td style={{ padding: '8px' }}>
                <a href={`mailto:${senderEmail}`}>{senderEmail}</a>
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 600 }}>Typ zapytania:</td>
              <td style={{ padding: '8px' }}>{formTypeLabels[type]}</td>
            </tr>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <td style={{ padding: '8px', fontWeight: 600, verticalAlign: 'top' }}>
                Wiadomość:
              </td>
              <td style={{ padding: '8px', whiteSpace: 'pre-wrap' }}>{message}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: '14px', color: '#888', lineHeight: '1.5' }}>
          Odpowiedz bezpośrednio na adres klienta: <a href={`mailto:${senderEmail}`}>{senderEmail}</a>
        </p>
      </>
    ),
    heading: 'Nowe zapytanie od klienta 📩',
    siteName: 'Eventizer',
    imageUrl: 'http://eventizer.pl/api/media/file/eventizer-icon-1.png',
    baseUrl: 'https://eventizer.pl',
    url: 'https://eventizer.pl/app',
  })
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
    imageUrl: 'http://eventizer.pl/api/media/file/eventizer-icon-1.png',
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
    imageUrl: 'http://eventizer.pl/api/media/file/eventizer-icon-1.png',
    baseUrl: 'https://eventizer.pl',
    url,
  })
}
