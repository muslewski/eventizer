import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { checkSubscription, SubscriptionStatus } from '@/actions/stripe/checkSubscription'
import { AdminLayoutClient } from './AdminLayoutClient'
import { SuppressHydrationWarnings } from '@/components/providers/SuppressHydrationWarnings'
import { Role } from '@/access/hierarchy'
import { Bebas_Neue, Montserrat } from 'next/font/google'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
   const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect('/')
  }

  const payload = await getPayload({ config })
  const user = await payload.find({
    collection: 'users',
    where: { email: { equals: session.user.email } },
    limit: 1,
  })

  const userRole = user?.docs[0]?.role

  return (
    <div
      id="admin-layout"
      data-user-role={userRole ?? undefined}
      className={`${bebasNeue.variable} ${montserrat.variable} overflow-x-clip`}
      suppressHydrationWarning
    >
      <SuppressHydrationWarnings />
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </div>
  )
}
