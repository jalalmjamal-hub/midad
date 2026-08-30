import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, account } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const email = 'admin@midad.com'
    const password = '123456'
    const name = 'مدير النظام'

    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))

    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'المستخدم موجود بالفعل' })
    }

    const userId = crypto.randomUUID()
    const hashedPassword = await bcrypt.hash(password, 10)

    await db.insert(user).values({
      id: userId,
      name,
      email,
      role: 'manager',
      emailVerified: true,
      banned: false,
    })

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: email,
      providerId: 'credentials',
      issuer: 'local:credential',
      userId: userId,
      password: hashedPassword,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("CREATE ADMIN ERROR:", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
