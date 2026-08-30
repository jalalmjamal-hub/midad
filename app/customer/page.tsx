import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function CustomerPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const role = (session.user as { role?: string }).role ?? 'customer'
  if (role !== 'customer') redirect('/')
  return (
    <main dir="rtl" className="min-h-screen bg-background p-6 text-foreground md:p-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold text-primary">مداد للخدمات الذكية</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">مرحبًا، {session.user.name}</h1>
        <p className="mt-3 leading-6 text-muted-foreground">تم تسجيل دخولك كعميل. يمكنك متابعة طلباتك والتواصل مع فريق مداد من بوابة العميل.</p>
        <form action="/api/auth/sign-out" method="post" className="mt-8">
          <button className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">تسجيل الخروج</button>
        </form>
      </div>
    </main>
  )
}
