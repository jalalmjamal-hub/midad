import { db } from '@/lib/db'
import { account, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

/**
 * إنشاء حساب المسؤول الأول بأمان
 * استخدام Drizzle مباشرة بدلاً من Better Auth API
 */
export async function POST(request: NextRequest) {
  try {
    // 1️⃣ التحقق من عدم وجود مسؤولين في النظام
    const existingManagers = await db
      .select()
      .from(user)
      .where(eq(user.role, 'manager'))
      .limit(1)

    if (existingManagers.length > 0) {
      return NextResponse.json(
        { error: 'يوجد مسؤول في النظام بالفعل. لا يمكن إنشاء مسؤول جديد.' },
        { status: 403 }
      )
    }

    // 2️⃣ التحقق من صحة البيانات المدخلة
    const body = await request.json()
    const { email, password, name } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const emailLower = email.toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني غير صحيحة' }, { status: 400 })
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'كلمة المرور مطلوبة' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      )
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error: 'كلمة المرور ضعيفة',
          details: 'يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام. مثال: Admin@123456'
        },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'اسم المسؤول مطلوب' }, { status: 400 })
    }

    // 3️⃣ التحقق من وجود هذا البريد من قبل
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, emailLower))
      .limit(1)

    if (existingUser.length > 0) {
      const userId = existingUser[0].id
      await db.delete(account).where(eq(account.userId, userId))
      await db.delete(user).where(eq(user.id, userId))
    }

    // 4️⃣ تجزئة كلمة المرور (Base64 مؤقتًا)
    const passwordHash = Buffer.from(password).toString('base64')

    // 5️⃣ إنشاء المستخدم
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const result = await db.insert(user).values({
      id: newUserId,
      email: emailLower,
      name: name,
      emailVerified: true,
      role: 'manager',
      banned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'فشل في إنشاء المستخدم في قاعدة البيانات' },
        { status: 500 }
      )
    }

    // 6️⃣ إنشاء الحساب بدون createdAt / updatedAt (لأنها defaultNow)
    const accountId = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await db.insert(account).values({
      id: accountId,
      userId: newUserId,
      accountId: emailLower,
      providerId: 'credential',
      password: passwordHash
    })

    // 7️⃣ إرجاع الاستجابة الناجحة
    return NextResponse.json(
      {
        success: true,
        message: 'تم إنشاء حساب المسؤول بنجاح! 🎉',
        user: {
          id: newUserId,
          email: emailLower,
          name: name,
          role: 'manager'
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[Setup Admin Error]', error)
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف'

    return NextResponse.json(
      {
        error: 'حدث خطأ في إنشاء الحساب',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * التحقق من وجود مسؤول في النظام
 */
export async function GET() {
  try {
    const managers = await db
      .select()
      .from(user)
      .where(eq(user.role, 'manager'))
      .limit(1)

    return NextResponse.json({
      setupComplete: managers.length > 0,
      managerCount: managers.length
    })
  } catch (error) {
    console.error('[Setup Check Error]', error)
    return NextResponse.json(
      {
        setupComplete: false,
        managerCount: 0,
        error: 'فشل الاتصال بقاعدة البيانات'
      },
      { status: 500 }
    )
  }
}
