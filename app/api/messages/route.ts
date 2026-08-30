import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { contactMessages } from '@/lib/db/schema'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.name || !body.phone || !body.message) return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 })
  const [message] = await db.insert(contactMessages).values({ name: body.name, phone: body.phone, message: body.message }).returning()
  return NextResponse.json(message, { status: 201 })
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || !['manager', 'employee'].includes(role ?? '')) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  return NextResponse.json(await db.select().from(contactMessages))
}
