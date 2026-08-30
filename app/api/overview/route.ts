import { NextResponse } from 'next/server'
import { and, count, eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders, technicians } from '@/lib/db/schema'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !['manager', 'employee'].includes(role ?? '')) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const [total, today, activeTechs, completed] = await Promise.all([
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(orders).where(sql`DATE(${orders.createdAt}) = CURRENT_DATE`),
    db.select({ value: count() }).from(technicians).where(eq(technicians.status, 'available')),
    db.select({ value: count() }).from(orders).where(eq(orders.status, 'completed')),
  ])
  return NextResponse.json({ total: total[0]?.value ?? 0, today: today[0]?.value ?? 0, activeTechnicians: activeTechs[0]?.value ?? 0, completed: completed[0]?.value ?? 0 })
}
