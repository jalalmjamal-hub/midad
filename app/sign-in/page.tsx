'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))

    // 🔥 التعديل المهم هنا
    const result = await signIn.credentials({
      email,
      password
    })

    if (result.error) {
      setError('بيانات الدخول غير صحيحة')
    } else {
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm"
      >
        <p className="mb-2 text-sm text-muted-foreground">مداد المتقدمة للتجارة</p>
        <h1 className="mb-2 text-3xl font-bold">دخول الموظفين</h1>
        <p className="mb-8 text-muted-foreground">للوصول إلى لوحة الإدارة والطلبات</p>

        <label className="mb-2 block text-sm font-medium">البريد الإلكتروني</label>
        <input
          name="email"
          type="email"
          required
          className="mb-5 w-full rounded-xl border border-border bg-background p-3"
          dir="ltr"
        />

        <label className="mb-2 block text-sm font-medium">كلمة المرور</label>
        <input
          name="password"
          type="password"
          required
          className="mb-4 w-full rounded-xl border border-border bg-background p-3"
          dir="ltr"
        />

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-primary p-3 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>
    </main>
  )
}
