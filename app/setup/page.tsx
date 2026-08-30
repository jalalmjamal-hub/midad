'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SetupPage() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('jalalmjamal@gmail.com')
  const [password, setPassword] = useState('Awamia@123')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

  const addMessage = (msg: string) => {
    console.log('[v0]', msg)
    setMessages((prev) => [...prev, msg])
  }

  const createAdmin = async () => {
    setLoading(true)
    setMessages([])

    try {
      addMessage('1️⃣ بدء عملية إنشاء حساب المدير...')
      addMessage(`البريد: ${email}`)
      addMessage(`كلمة المرور: ${password}`)

      addMessage('2️⃣ إرسال البيانات إلى السيرفر...')
      setStep(1)

      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: 'مدير النظام' }),
      })

      addMessage('3️⃣ انتظار رد السيرفر...')
      setStep(2)

      const data = await response.json()
      console.log('[v0] رد السيرفر:', data)

      if (!response.ok) {
        addMessage(`❌ خطأ: ${data.error || 'فشل في إنشاء الحساب'}`)
        setStep(3)
        return
      }

      addMessage('4️⃣ تجزئة كلمة المرور...')
      setStep(3)

      addMessage('5️⃣ حفظ في قاعدة البيانات...')
      setStep(4)

      addMessage('✅ تم إنشاء الحساب بنجاح!')
      addMessage(`يمكنك الآن تسجيل الدخول بالبريد: ${email}`)
      addMessage(`كلمة المرور: ${password}`)
      setStep(5)
    } catch (error) {
      addMessage(`❌ خطأ: ${error instanceof Error ? error.message : 'حدث خطأ ما'}`)
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">إنشاء حساب المدير</h1>

        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            <Button
              onClick={createAdmin}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-lg transition"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء حساب المدير'}
            </Button>
          </div>

          {messages.length > 0 && (
            <div className="bg-muted p-4 rounded-lg border border-border">
              <h3 className="font-medium text-foreground mb-3">خطوات العملية:</h3>
              <div className="space-y-2">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-sm font-mono ${
                      msg.includes('❌') ? 'text-destructive' : 'text-foreground'
                    } ${msg.includes('✅') ? 'text-green-600' : ''}`}
                  >
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-3">تم الإنشاء بنجاح! 🎉</p>
              <p className="text-green-700 text-sm mb-2">
                يمكنك الآن الذهاب إلى صفحة تسجيل الدخول:
              </p>
              <a
                href="/sign-in"
                className="text-green-700 font-medium underline hover:text-green-800"
              >
                اذهب إلى تسجيل الدخول
              </a>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">ملاحظة: هذه الصفحة مؤقتة لإنشاء حساب المدير الأول فقط.</p>
          <p>بعد إنشاء الحساب، يمكن حذف هذه الصفحة أو إضافة حماية عليها.</p>
        </div>
      </div>
    </div>
  )
}
