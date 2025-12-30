'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Settings, ArrowUpCircle } from 'lucide-react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useAuth } from '@payloadcms/ui'

function UpgradeSubscriptionField() {
  const router = useRouter()
  const { id } = useDocumentInfo()
  const { user } = useAuth()

  // Only show for the current user viewing their own profile
  // or if viewing from the admin panel
  const isOwnProfile = user?.id === id

  const handleChangePlan = () => {
    router.push('/app/onboarding/service-provider?edit=true')
  }

  if (!isOwnProfile) {
    return (
      <div className="text-sm text-gray-500">
        Zmiana planu dostępna tylko dla właściciela konta.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 justify-center">
      {/* <p className="text-sm text-gray-600 dark:text-gray-400">
        Zmień kategorię usług lub przejdź na inny plan subskrypcji.
      </p> */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleChangePlan}>
          <Settings className="h-4 w-4 mr-2" />
          Zmień kategorię
        </Button>
        <Button onClick={handleChangePlan}>
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          Zmień plan
        </Button>
      </div>
    </div>
  )
}

export default UpgradeSubscriptionField
