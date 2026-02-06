'use client'

import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import Link from 'next/link'

export function HomeButton() {
  return (
    <Button variant="golden" asChild className="no-underline">
      <Link href="/">
        <Home className="size-4" />
        Strona główna
      </Link>
    </Button>
  )
}
