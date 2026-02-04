'use client'

import { Button } from '@/components/ui/button'
import { useAuth, useTranslation } from '@payloadcms/ui'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CustomLogoutButton() {
  const { t } = useTranslation()
  const router = useRouter()
  const { logOut, user } = useAuth()
  const userRole = user?.role?.name || 'unknown'

  const handleLogout = async () => {
    try {
      await logOut()
      console.log('====================================')
      console.log(user)
      console.log('====================================')
      console.log('====================================')
      console.log('userROle: ', userRole)
      console.log('====================================')
      if (userRole === 'service-provider') {
        router.replace('/auth/sign-in/service-provider')
      } else {
        router.replace('/auth/sign-in')
      }
    } finally {
      router.refresh()
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="size-4" />
      {t('authentication:logOut')}
    </Button>
  )
}
