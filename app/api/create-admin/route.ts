import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export async function GET() {
  try {
    const email = 'admin@midad.com'
    const password = '123456'
    const name = 'مدير النظام'

    // تحقق إذا المستخدم موجود
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))

    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'المستخدم موجود بالفعل' })
    }

    // إنشاء user.id عشوائي
    const userId = crypto.randomUUID()

    // تشفير كلمة المرور
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex')

    // إنشاء المستخدم في جدول user
    await db.insert(user).values({
      id: userId,
      name,
      email,
      role: 'manager',
      emailVerified: true,
      banned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // إنشاء الحساب في جدول account
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: email,
      providerId: 'credentials',
      issuer: 'local:credential',
      userId: userId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'فشل في إنشاء الحساب' },
      { status: 500 }
    )
  }
}