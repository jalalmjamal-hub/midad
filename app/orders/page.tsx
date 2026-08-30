import { OrdersPanel } from '@/components/orders-panel'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || !['manager', 'employee'].includes((session.user as { role?: string }).role ?? '')) redirect('/sign-in')
  let rows = []
  try {
    rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100)
  } catch {
    rows = []
  }
  return <main dir="rtl" className="min-h-screen bg-background p-5 text-foreground md:p-10"><div className="mx-auto max-w-[1400px]"><OrdersPanel initialOrders={rows} /></div></main>
}
