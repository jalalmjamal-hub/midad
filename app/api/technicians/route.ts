import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { technicians } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function staff() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as { role?: string } | undefined)?.role
  return session?.user && ['manager', 'employee'].includes(role ?? '')
}
export async function GET() { if (!await staff()) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 }); return NextResponse.json(await db.select().from(technicians)) }
export async function POST(request: Request) { if (!await staff()) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 }); const body = await request.json(); if (!body.name || !body.phone || !body.specialty) return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 }); const [row] = await db.insert(technicians).values({ name: body.name, phone: body.phone, specialty: body.specialty, status: body.status ?? 'available' }).returning(); return NextResponse.json(row, { status: 201 }) }
export async function PATCH(request: Request) { if (!await staff()) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 }); const body = await request.json(); const [row] = await db.update(technicians).set({ name: body.name, phone: body.phone, specialty: body.specialty, status: body.status, updatedAt: new Date() }).where(eq(technicians.id, Number(body.id))).returning(); return row ? NextResponse.json(row) : NextResponse.json({ error: 'الفني غير موجود' }, { status: 404 }) }
