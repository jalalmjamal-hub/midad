import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/authorization'

export async function GET() {
  const current = await getCurrentUser()
  if (current?.role !== 'manager') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const users = await db.select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }).from(user)
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const current = await getCurrentUser()
  if (current?.role !== 'manager') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const body = await request.json()
  if (!body.name?.trim() || !body.email?.trim() || !body.password || !['manager', 'employee', 'customer'].includes(body.role)) return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور والدور مطلوبة' }, { status: 400 })
  if (body.password.length < 8) return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
  try {
    const result = await auth.api.signUpEmail({ body: { name: body.name.trim(), email: body.email.trim().toLowerCase(), password: body.password } })
    if (!result.user) return NextResponse.json({ error: 'تعذر إنشاء المستخدم' }, { status: 500 })
    const [updated] = await db.update(user).set({ role: body.role, emailVerified: true, updatedAt: new Date() }).where(eq(user.id, result.user.id)).returning({ id: user.id, name: user.name, email: user.email, role: user.role })
    return NextResponse.json(updated, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'تعذر إنشاء المستخدم، قد يكون البريد مستخدمًا بالفعل' }, { status: 409 })
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentUser()
  if (current?.role !== 'manager') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const body = await request.json()
  if (!body.id || !body.name?.trim() || !body.email?.trim() || !['manager', 'employee', 'customer'].includes(body.role)) return NextResponse.json({ error: 'الاسم والبريد والدور مطلوبة' }, { status: 400 })
  if (body.id === current.id && body.role !== 'manager') return NextResponse.json({ error: 'لا يمكن إزالة صلاحية المدير الحالي' }, { status: 400 })
  try {
    const [updated] = await db.update(user).set({ name: body.name.trim(), email: body.email.trim().toLowerCase(), role: body.role, updatedAt: new Date() }).where(eq(user.id, body.id)).returning({ id: user.id, name: user.name, email: user.email, role: user.role })
    if (!updated) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    if (body.password) {
      if (body.password.length < 8) return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
      await auth.api.setUserPassword({ body: { userId: body.id, newPassword: body.password }, headers: await request.headers })
    }
    return NextResponse.json(updated)
  } catch { return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 }) }
}

export async function DELETE(request: Request) {
  const current = await getCurrentUser()
  if (current?.role !== 'manager') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  const body = await request.json()
  if (!body.id || body.id === current.id) return NextResponse.json({ error: 'لا يمكنك حذف حسابك الحالي' }, { status: 400 })
  const [target] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, body.id)).limit(1)
  if (!target) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
  if (target.role === 'manager') {
    const managers = await db.select({ id: user.id }).from(user).where(eq(user.role, 'manager'))
    if (managers.length <= 1) return NextResponse.json({ error: 'يجب أن يبقى مدير واحد على الأقل' }, { status: 400 })
  }
  await db.delete(user).where(eq(user.id, body.id))
  return NextResponse.json({ success: true })
}
