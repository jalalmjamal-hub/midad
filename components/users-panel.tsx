'use client'

import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((response) => response.json())

export function UsersPanel() {
  const { data: users = [], mutate } = useSWR('/api/users', fetcher)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' })
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string; email: string; role: string; password: string } | null>(null)

  async function createUser(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await response.json()
    if (!response.ok) return setMessage(data.error || 'تعذر إنشاء المستخدم')
    setForm({ name: '', email: '', password: '', role: 'employee' })
    setMessage('تم إنشاء المستخدم بنجاح')
    mutate()
  }

  async function saveUser() {
    if (!editing) return
    const response = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    const data = await response.json()
    setMessage(response.ok ? 'تم تحديث المستخدم' : data.error || 'تعذر التحديث')
    if (response.ok) { setEditing(null); mutate() }
  }

  async function deleteUser(id: string) {
    if (!window.confirm('هل تريد حذف هذا المستخدم؟')) return
    const response = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const data = await response.json()
    setMessage(response.ok ? 'تم حذف المستخدم' : data.error || 'تعذر الحذف')
    if (response.ok) mutate()
  }

  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold text-primary">إدارة الوصول</p><h2 className="font-serif text-2xl font-bold">المستخدمون والصلاحيات</h2><p className="mt-1 text-sm text-muted-foreground">غيّر دور المستخدم، وتأكد أن كل حساب يصل فقط لما يحتاجه.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">المدير فقط</span></div>
    <form onSubmit={createUser} className="mt-6 grid gap-3 rounded-xl bg-muted/40 p-4 md:grid-cols-5">
      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المستخدم" aria-label="اسم المستخدم" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="البريد الإلكتروني" aria-label="البريد الإلكتروني" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
      <input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="كلمة المرور" aria-label="كلمة المرور" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label="نوع المستخدم" className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="employee">موظف</option><option value="manager">مدير</option><option value="customer">عميل</option></select>
      <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">إضافة المستخدم</button>
      {message && <p className="md:col-span-5 text-sm text-muted-foreground" role="status">{message}</p>}
    </form>
    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[620px] text-right text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-3 py-3">المستخدم</th><th className="px-3 py-3">البريد</th><th className="px-3 py-3">الدور</th><th className="px-3 py-3">كلمة المرور</th><th className="px-3 py-3">الإجراء</th></tr></thead><tbody className="divide-y divide-border">{users.map((item: { id: string; name: string; email: string; role: string }) => <tr key={item.id}><td className="px-3 py-4 font-medium">{editing?.id === item.id ? <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-9 w-32 rounded-lg border border-input bg-background px-2" /> : item.name}</td><td className="px-3 py-4 text-muted-foreground">{editing?.id === item.id ? <input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="h-9 w-48 rounded-lg border border-input bg-background px-2" /> : item.email}</td><td className="px-3 py-4">{editing?.id === item.id ? <input type="password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} placeholder="كلمة مرور جديدة (اختياري)" aria-label="كلمة مرور جديدة" className="h-9 w-44 rounded-lg border border-input bg-background px-2 text-xs" /> : <span className="text-xs text-muted-foreground">••••••••</span>}</td><td className="px-3 py-4"><select aria-label={`دور ${item.name}`} value={editing?.id === item.id ? editing.role : item.role} onChange={(event) => editing?.id === item.id ? setEditing({ ...editing, role: event.target.value }) : undefined} className="h-9 rounded-lg border border-input bg-background px-2 text-xs"><option value="manager">مدير</option><option value="employee">موظف</option><option value="customer">عميل</option></select></td><td className="flex gap-2 px-3 py-4">{editing?.id === item.id ? <><button type="button" onClick={saveUser} className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">حفظ</button><button type="button" onClick={() => setEditing(null)} className="rounded-lg border px-3 py-2 text-xs">إلغاء</button></> : <><button type="button" onClick={() => setEditing({ id: item.id, name: item.name, email: item.email, role: item.role, password: '' })} className="rounded-lg border px-3 py-2 text-xs">تعديل</button><button type="button" onClick={() => deleteUser(item.id)} className="rounded-lg border border-destructive/40 px-3 py-2 text-xs text-destructive">حذف</button></>}</td></tr>)}{users.length === 0 && <tr><td colSpan={4} className="px-3 py-10 text-center text-muted-foreground">لا توجد بيانات أو ليس لديك صلاحية العرض.</td></tr>}</tbody></table></div>
  </section>
}
