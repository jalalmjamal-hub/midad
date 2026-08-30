import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { warrantyCertificates } from '@/lib/db/schema'
import { headers } from 'next/headers'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !['manager', 'employee'].includes(role ?? '')) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  return NextResponse.json(await db.select().from(warrantyCertificates))
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !['manager', 'employee'].includes(role ?? '')) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const body = await request.json()
  if (!body.orderId || !body.customerName || !body.product || !body.expiresAt) return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 })
  const [certificate] = await db.insert(warrantyCertificates).values({ orderId: Number(body.orderId), certificateNumber: `WRT-${Date.now().toString().slice(-8)}`, customerName: body.customerName, product: body.product, expiresAt: new Date(body.expiresAt), notes: body.notes ?? '' }).returning()
  return NextResponse.json(certificate, { status: 201 })
}
