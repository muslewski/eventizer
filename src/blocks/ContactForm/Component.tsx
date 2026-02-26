import type { ContactFormBlock as ContactFormBlockProps } from '@/payload-types'
import { ContactFormClient } from './Component.client'

export const ContactFormBlock: React.FC<
  ContactFormBlockProps & { id?: string | number; className?: string }
> = (props) => {
  return <ContactFormClient {...props} />
}
