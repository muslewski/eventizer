import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { checkSubscription, SubscriptionStatus } from '@/actions/stripe/checkSubscription'
import { AdminLayoutClient } from './AdminLayoutClient'
import { Role } from '@/access/hierarchy'

export interface AdminLayoutProps {
  children: React.ReactNode
}

export interface UserSubscriptionData {
  userId: number | null
  role: Role | null
  subscriptionStatus: SubscriptionStatus | null
}

async function getUserSubscriptionData(): Promise<UserSubscriptionData> {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session?.user) {
    redirect('/auth/sign-in')
  }

  // Get user from Payload to get the role
  const payload = await getPayload({ config })
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: session.user.email } },
    limit: 1,
  })

  const user = users.docs[0]
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Only check subscription for service providers
  let subscriptionStatus: SubscriptionStatus | null = null
  if (user.role === 'service-provider') {
    subscriptionStatus = await checkSubscription(user.id)
  }

  return {
    userId: user.id,
    role: user.role,
    subscriptionStatus,
  }
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const userSubscriptionData = await getUserSubscriptionData()

  return (
    // <AdminLayoutClient userSubscriptionData={userSubscriptionData}>{children}</AdminLayoutClient>
    <div id="admin-layout" data-user-role={userSubscriptionData.role ?? undefined}>
      <AdminLayoutClient userSubscriptionData={userSubscriptionData}>{children}</AdminLayoutClient>
    </div>
  )
}
