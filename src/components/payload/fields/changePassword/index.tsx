'use client'

import { Button } from '@/components/ui/button'
import { KeyRound } from 'lucide-react'
import Link from 'next/link'

export default function ChangePasswordField() {
  return (
    <div>
      <Button variant="outline" asChild>
        <Link href="/auth/forgot-password">
          <KeyRound className="mr-2 h-4 w-4" />
          Zmień Hasło
        </Link>
      </Button>
    </div>
  )
}
