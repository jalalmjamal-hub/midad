import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: 'البريد وكلمة المرور (8 أحرف على الأقل) مطلوبة' }, { status: 400 })
    }

    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)
    if (existing.length) {
      await db.delete(account).where(eq(account.userId, existing[0].id))
      await db.delete(user).where(eq(user.email, email))
    }

    const result = await auth.api.signUpEmail({
      body: { email, password, name: name || 'مدير النظام' },
    })
    if (!result.user) return NextResponse.json({ error: 'تعذر إنشاء الحساب' }, { status: 500 })

    await db.update(user).set({ role: 'manager', emailVerified: true, updatedAt: new Date() }).where(eq(user.id, result.user.id))
    return NextResponse.json({ success: true, message: 'تم إنشاء حساب المدير بنجاح', email })
  } catch (error) {
    console.error('[v0] إنشاء حساب المدير:', error)
    return NextResponse.json({ error: 'فشل في إنشاء الحساب' }, { status: 500 })
  }
}
