import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || !['manager', 'employee'].includes((session.user as { role?: string }).role ?? '')) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100)
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const body = await request.json()
  if (!body.customerName || !body.customerPhone || !body.city || !body.address || !body.product || !body.appointmentAt) return NextResponse.json({ error: 'البيانات الأساسية مطلوبة' }, { status: 400 })
  const [created] = await db.insert(orders).values({ userId: session.user.id, orderNumber: `MD-${Date.now().toString().slice(-6)}`, customerName: body.customerName, customerPhone: body.customerPhone, city: body.city, address: body.address, product: body.product, appointmentAt: new Date(body.appointmentAt), notes: body.notes ?? '' }).returning()
  return NextResponse.json(created, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const id = Number(body.id)
  if (!Number.isInteger(id) || !body.appointmentAt) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
  const [updated] = await db.update(orders).set({ appointmentAt: new Date(body.appointmentAt), status: 'scheduled', updatedAt: new Date() }).where(eq(orders.id, id)).returning()
  if (!updated) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'رقم طلب غير صحيح' }, { status: 400 })
  const [deleted] = await db.delete(orders).where(eq(orders.id, id)).returning({ id: orders.id })
  if (!deleted) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
  return NextResponse.json({ ok: true, id: deleted.id })
}
