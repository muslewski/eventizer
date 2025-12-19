import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

// Handle authentication errors and redirect accordingly
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const error = searchParams.get('error')

  // Log the error if needed
  console.log('Auth error:', error)

  // Redirect to your desired page
  redirect('/app/auth/sign-in')
}
