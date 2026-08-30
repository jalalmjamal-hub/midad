'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { hash } from 'better-auth/password'
import { eq } from 'drizzle-orm'

export async function createAdminUser(
  email: string,
  password: string,
  name: string = 'مدير النظام'
) {
  try {
    // التحقق من عدم وجود المستخدم
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))

    if (existingUser.length > 0) {
      return { error: 'المستخدم موجود بالفعل' }
    }

    // تجزئة كلمة المرور
    const hashedPassword = await hash(password)

    // إنشاء المستخدم
    await db.insert(user).values({
      email,
      name,
      password: hashedPassword,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'manager',
    })

    return { success: true, message: 'تم إنشاء حساب المدير بنجاح' }
  } catch (error) {
    console.error('[v0] خطأ في إنشاء حساب المدير:', error)
    return { error: 'فشل في إنشاء الحساب' }
  }
}
