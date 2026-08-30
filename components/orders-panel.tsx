'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, ExternalLink, Search, Trash2, UserRound, X } from 'lucide-react'

type Order = { id: number; orderNumber: string; customerName: string; customerPhone: string; city: string; address: string; product: string; status: string; technicianName: string | null; appointmentAt: string | null }
const labels: Record<string, string> = { new: 'جديد', assigned: 'تم توجيه الفني', scheduled: 'موعد مؤكد', completed: 'مكتمل', cancelled: 'ملغي' }
const colors: Record<string, string> = { new: 'bg-muted text-muted-foreground', assigned: 'bg-secondary text-secondary-foreground', scheduled: 'bg-warning/15 text-warning-foreground', completed: 'bg-success/10 text-success', cancelled: 'bg-destructive/10 text-destructive' }

export function OrdersPanel({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [editDate, setEditDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(initialOrders.length === 0)
  useEffect(() => {
    let active = true
    fetch('/api/orders').then(response => response.ok ? response.json() : []).then(data => {
      if (active) setOrders(data)
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])
  const filtered = useMemo(() => orders.filter(o => (status === 'all' || o.status === status) && `${o.orderNumber} ${o.customerName} ${o.city} ${o.product}`.includes(query)), [orders, query, status])
  const updateAppointment = async () => {
    if (!selected || !editDate) return
    setBusy(true)
    const response = await fetch('/api/orders', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: selected.id, appointmentAt: new Date(editDate).toISOString(), status: 'scheduled' }) })
    if (response.ok) {
      const updated = await response.json()
      setOrders(current => current.map(order => order.id === updated.id ? updated : order))
      setSelected(updated)
    }
    setBusy(false)
  }
  const deleteOrder = async () => {
    if (!selected || !window.confirm(`هل تريد حذف الطلب ${selected.orderNumber}؟`)) return
    setBusy(true)
    const response = await fetch(`/api/orders?id=${selected.id}`, { method: 'DELETE' })
    if (response.ok) { setOrders(current => current.filter(order => order.id !== selected.id)); setSelected(null) }
    setBusy(false)
  }
  const whatsapp = selected ? `https://wa.me/${selected.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحبًا ${selected.customerName}، نؤكد موعد طلبكم ${selected.orderNumber} لدى مداد بتاريخ ${selected.appointmentAt || 'يحدد لاحقًا'}.`)}` : '#'
  return <section className="space-y-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold text-primary">إدارة العمليات</p><h2 className="font-serif text-3xl font-bold">الطلبات</h2><p className="mt-2 text-sm text-muted-foreground">ابحث، صفِّ، ووجّه الفنيين من مكان واحد.</p></div><div className="flex flex-wrap gap-3"><div className="relative"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="بحث في الطلبات" value={query} onChange={e => setQuery(e.target.value)} placeholder="رقم الطلب أو العميل" className="h-10 rounded-lg border border-input bg-background pr-9 pl-3 text-sm" /></div><select aria-label="فلترة الحالة" value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="all">كل الحالات</option>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div></div><div className="overflow-hidden rounded-2xl border border-border bg-card"><table className="w-full text-right text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3">الطلب</th><th className="px-5 py-3">العميل</th><th className="px-5 py-3">الخدمة</th><th className="px-5 py-3">الحالة</th><th className="px-5 py-3">الفني</th><th className="px-5 py-3">إجراء</th></tr></thead><tbody className="divide-y divide-border">{loading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">جارٍ تحميل الطلبات...</td></tr> : filtered.map(order => <tr key={order.id} className="hover:bg-muted/30"><td className="px-5 py-4 font-mono text-xs font-bold text-primary">{order.orderNumber}</td><td className="px-5 py-4"><div className="font-medium">{order.customerName}</div><div className="text-xs text-muted-foreground">{order.city}</div></td><td className="px-5 py-4 text-muted-foreground">{order.product}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[order.status] || 'bg-muted'}`}>{labels[order.status] || order.status}</span></td><td className="px-5 py-4 text-muted-foreground">{order.technicianName || 'غير محدد'}</td><td className="px-5 py-4"><button onClick={() => { setSelected(order); setEditDate(order.appointmentAt ? order.appointmentAt.slice(0, 16) : '') }} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"><ExternalLink className="size-4" />التفاصيل</button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">لا توجد طلبات مطابقة.</div>}</div>{selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg space-y-5 rounded-2xl bg-card p-6 shadow-xl"><div className="flex items-center justify-between"><h3 className="text-xl font-bold">تفاصيل الطلب {selected.orderNumber}</h3><button aria-label="إغلاق" onClick={() => setSelected(null)}><X className="size-5" /></button></div><div className="grid gap-3 text-sm"><p><span className="text-muted-foreground">العميل:</span> {selected.customerName}</p><p><span className="text-muted-foreground">العنوان:</span> {selected.address}</p><p><span className="text-muted-foreground">الفني:</span> {selected.technicianName || 'غير محدد'}</p></div><label className="block space-y-2 text-sm font-medium"><span className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />تعديل الموعد</span><input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3" /></label><div className="flex flex-wrap gap-2"><button disabled={busy || !editDate} onClick={updateAppointment} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Check className="size-4" />حفظ الموعد</button><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary"><ExternalLink className="size-4" />تأكيد واتساب</a><button disabled={busy} onClick={deleteOrder} className="inline-flex items-center gap-2 rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-50"><Trash2 className="size-4" />حذف الطلب</button></div></div></div>}</section>
}
