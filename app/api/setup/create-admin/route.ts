import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

/**
 * إنشاء حساب المسؤول الأول بأمان
 * - التحقق من عدم وجود مسؤولين سابقين
 * - التحقق من قوة كلمة المرور
 * - حذف أي حسابات سابقة بنفس البريد
 */
export async function POST(request: NextRequest) {
  try {
    // 1️⃣ التحقق من عدم وجود مسؤولين في النظام
    const existingManagers = await db.select().from(user).where(eq(user.role, 'manager'))
    if (existingManagers.length > 0) {
      return NextResponse.json(
        { error: 'يوجد مسؤول في النظام بالفعل. لا يمكن إنشاء مسؤول جديد.' },
        { status: 403 }
      )
    }

    // 2️⃣ التحقق من صحة البيانات المدخلة
    const { email, password, name } = await request.json()
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صحيح' },
        { status: 400 }
      )
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    // التحقق من قوة كلمة المرور (تحتوي على أرقام وأحرف كبيرة وصغيرة)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          error: 'كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام',
          details: 'مثال: Admin@123'
        },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'اسم المسؤول مطلوب' },
        { status: 400 }
      )
    }

    // 3️⃣ حذف أي حسابات سابقة بنفس البريد
    const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase())).limit(1)
    if (existing.length > 0) {
      await db.delete(account).where(eq(account.userId, existing[0].id))
      await db.delete(user).where(eq(user.id, existing[0].id))
    }

    // 4️⃣ إنشاء الحساب عبر Better Auth
    const result = await auth.api.signUpEmail({
      body: { 
        email: email.toLowerCase(), 
        password, 
        name 
      },
    })

    if (!result.user || !result.user.id) {
      return NextResponse.json(
        { error: 'تعذر إنشاء الحساب. يرجى المحاولة لاحقاً' },
        { status: 500 }
      )
    }

    // 5️⃣ تحديث الدور إلى manager والتحقق من البريد
    await db
      .update(user)
      .set({ 
        role: 'manager', 
        emailVerified: true, 
        updatedAt: new Date() 
      })
      .where(eq(user.id, result.user.id))

    // 6️⃣ إرجاع الاستجابة الناجحة
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حساب المسؤول بنجاح',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: 'manager'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[Setup Admin Error]', error)
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الحساب. يرجى المحاولة لاحقاً' },
      { status: 500 }
    )
  }
}

/**
 * التحقق من وجود مسؤول في النظام
 */
export async function GET() {
  try {
    const managers = await db.select().from(user).where(eq(user.role, 'manager'))
    return NextResponse.json({
      setupComplete: managers.length > 0,
      managerCount: managers.length
    })
  } catch (error) {
    console.error('[Setup Check Error]', error)
    return NextResponse.json(
      { setupComplete: true, managerCount: -1 },
      { status: 500 }
    )
  }
}
