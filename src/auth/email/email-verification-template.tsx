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
        <p>{`Witaj ${userName},`}</p>
        <p>Kliknij przycisk poniżej, aby zweryfikować swój adres email.</p>
      </>
    ),

    heading: 'Zweryfikuj swój email',
    siteName: 'Eventizer',
    imageUrl: 'https://drive.google.com/uc?id=1lFmeTTRsEzMt78s-HCxGbKbP4hcRXjnL', // TODO Replace to real link
    baseUrl: 'https://localhost:3000/app',
    url,
  })
}
