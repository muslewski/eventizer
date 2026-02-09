'use client'

import { useEffect } from 'react'
import { authClient } from '@/auth/auth-client'
import { useRouter } from 'next/navigation'

const SignOutRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    const performSignOut = async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/"); // redirect to login page
          },
        },
      })
    }

    performSignOut()
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Wylogowywanie...</p>
    </div>
  )
}

export default SignOutRedirect