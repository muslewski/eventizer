'use client'

import { Button } from '@/components/ui/button'
import { useAuth, useTranslation } from '@payloadcms/ui'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CustomLogoutButton() {
  const { t } = useTranslation()
  const router = useRouter()
  const { logOut } = useAuth()

  const handleLogout = async () => {
    try {
      await logOut()
      router.replace('/auth/sign-in')
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
