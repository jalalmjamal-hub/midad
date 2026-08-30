'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * إنشاء حساب مسؤول الأول
 * تتعامل مع:
 * 1. التحقق من عدم وجود مسؤول بالفعل
 * 2. إنشاء المستخدم عبر Better Auth
 * 3. تحديث الدور إلى manager
 */
export async function createAdminUser(
  email: string,
  password: string,
  name: string = 'مدير النظام'
) {
  try {
    // 1️⃣ التحقق من وجود مسؤول في النظام
    const existingManagers = await db
      .select()
      .from(user)
      .where(eq(user.role, 'manager'))

    if (existingManagers.length > 0) {
      return { 
        error: 'يوجد مسؤول في النظام بالفعل! لا يمكن إنشاء مسؤول جديد.' 
      }
    }

    // 2️⃣ التحقق من صيغة البريد
    if (!email.includes('@')) {
      return { error: 'البريد الإلكتروني غير صحيح' }
    }

    // 3️⃣ التحقق من قوة كلمة المرور
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return { 
        error: 'كلمة المرور ضعيفة. يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام (8 أحرف على الأقل)',
        details: 'مثال: Admin@123456'
      }
    }

    // 4️⃣ إنشاء المستخدم عبر Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase(),
        password,
        name
      }
    })

    if (!result.user || !result.user.id) {
      return { 
        error: 'فشل في إنشاء الحساب',
        details: 'حدث خطأ مع Better Auth'
      }
    }

    // 5️⃣ تحديث الدور إلى manager
    await db
      .update(user)
      .set({ 
        role: 'manager',
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(user.id, result.user.id))

    return { 
      success: true, 
      message: 'تم إنشاء حساب المدير بنجاح',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: 'manager'
      }
    }
  } catch (error) {
    console.error('[createAdminUser Error]', error)
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف'
    return { 
      error: 'فشل في إنشاء الحساب',
      details: errorMessage
    }
  }
}
