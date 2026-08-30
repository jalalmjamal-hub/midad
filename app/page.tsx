import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MidadDashboard } from '@/components/midad-dashboard'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const role = (session.user as { role?: string }).role ?? 'customer'
  if (role === 'customer') redirect('/customer')
  return <MidadDashboard />
}
