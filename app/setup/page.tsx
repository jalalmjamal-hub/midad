'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Step = 'check' | 'form' | 'loading' | 'success' | 'error'

interface AdminSetupState {
  setupComplete: boolean
  managerCount: number
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('check')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [messages, setMessages] = useState<{ text: string; type: 'info' | 'success' | 'error' }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [setupState, setSetupState] = useState<AdminSetupState | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/create-admin')
      const data = await response.json()
      setSetupState(data)

      if (data.setupComplete) {
        addMessage('إعداد النظام اكتمل بالفعل! سيتم تحويلك للدخول...', 'info')
        setTimeout(() => router.push('/sign-in'), 2000)
      } else {
        setStep('form')
        addMessage('مرحباً! الرجاء إنشاء حساب المسؤول الأول للنظام', 'info')
      }
    } catch (error) {
      addMessage(`خطأ: ${error instanceof Error ? error.message : 'فشل التحقق'}`, 'error')
      setStep('error')
    }
  }

  const addMessage = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessages((prev) => [...prev, { text, type }])
  }

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      setPasswordStrength('weak')
      return
    }
    const hasUppercase = /[A-Z]/.test(pass)
    const hasLowercase = /[a-z]/.test(pass)
    const hasNumber = /\d/.test(pass)

    if (hasUppercase && hasLowercase && hasNumber) {
      setPasswordStrength('strong')
    } else if ((hasUppercase || hasLowercase) && hasNumber) {
      setPasswordStrength('medium')
    } else {
      setPasswordStrength('weak')
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    validatePassword(value)
  }

  const createAdmin = async () => {
    if (!email.trim()) return addMessage('البريد الإلكتروني مطلوب', 'error')
    if (!name.trim()) return addMessage('اسم المسؤول مطلوب', 'error')
    if (password.length < 8) return addMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error')
    if (passwordStrength === 'weak') return addMessage('كلمة المرور ضعيفة. استخدم حروف كبيرة وصغيرة وأرقام', 'error')

    setIsLoading(true)
    setStep('loading')
    setMessages([])

    try {
      addMessage('🔐 يتم التحقق من صحة البيانات...', 'info')
      addMessage('📤 يتم إرسال البيانات إلى الخادم...', 'info')

      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        addMessage(`❌ ${data.error || 'فشل في إنشاء الحساب'}`, 'error')
        addMessage(`التفاصيل: ${data.details || 'تحقق من البيانات المدخلة'}`, 'error')
        setStep('error')
        setIsLoading(false)
        return
      }

      addMessage('💾 يتم حفظ البيانات...', 'info')
      addMessage('🎉 تم إنشاء حساب المسؤول بنجاح!', 'success')

      setStep('success')

      setTimeout(() => router.push('/sign-in'), 3000)
    } catch (error) {
      addMessage(`❌ خطأ: ${error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}`, 'error')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'check') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <h1 className="text-2xl font-bold mb-2">جاري التحقق من النظام...</h1>
          <p className="text-muted-foreground">الرجاء الانتظار</p>
        </div>
      </div>
    )
  }

  if (step === 'error' && !setupState?.setupComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
            <h1 className="text-2xl font-bold text-destructive mb-4">❌ خطأ</h1>
            <div className="space-y-3 mb-6">
              {messages.map((msg, idx) => (
                <p key={idx} className="text-sm text-foreground">{msg.text}</p>
              ))}
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              حاول مرة أخرى
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto">

          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">🔐 إعداد النظام</h1>
            <p className="text-muted-foreground text-lg">إنشاء حساب المسؤول الأول</p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 mb-6">

            {/* النموذج */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createAdmin()
              }}
              className="space-y-6"
            >

              {/* الاسم */}
              <div>
                <label className="block text-sm font-medium mb-2">👤 اسم المسؤول</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full px-4 py-3 border rounded-lg"
                  disabled={isLoading}
                />
              </div>

              {/* البريد */}
              <div>
                <label className="block text-sm font-medium mb-2">📧 البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  dir="ltr"
                  className="w-full px-4 py-3 border rounded-lg"
                  disabled={isLoading}
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">🔑 كلمة المرور</label>
                  <span className={`text-xs ${
                    passwordStrength === 'strong' ? 'text-green-600' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength === 'strong' && '💪 قوية'}
                    {passwordStrength === 'medium' && '⚠️ متوسطة'}
                    {passwordStrength === 'weak' && '⛔ ضعيفة'}
                  </span>
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="8 أحرف على الأقل (أحرف كبيرة + صغيرة + أرقام)"
                  dir="ltr"
                  className="w-full px-4 py-3 border rounded-lg"
                  disabled={isLoading}
                />
              </div>

              {/* زر الإنشاء */}
              <Button
                type="submit"
                disabled={isLoading || !email || !password || !name}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg"
              >
                {isLoading ? '⏳ جاري الإنشاء...' : '✓ إنشاء حساب المسؤول'}
              </Button>

            </form>
          </div>

          {/* سجل العملية */}
          {messages.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="font-semibold mb-4">📋 سجل العملية:</h3>
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 text-sm ${
                    msg.type === 'error' ? 'text-destructive' :
                    msg.type === 'success' ? 'text-green-600' :
                    'text-muted-foreground'
                  }`}>
                    <span>
                      {msg.type === 'error' && '❌'}
                      {msg.type === 'success' && '✅'}
                      {msg.type === 'info' && 'ℹ️'}
                    </span>
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-spin text-4xl">⏳</div>
          <h1 className="text-2xl font-bold mb-4">جاري إنشاء الحساب...</h1>
          {messages.map((msg, idx) => (
            <p key={idx} className="text-sm text-muted-foreground">{msg.text}</p>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 text-6xl animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold mb-2">تم بنجاح!</h1>
          <p className="mb-6">تم إنشاء حساب المسؤول بنجاح</p>

          <Button
            onClick={() => router.push('/sign-in')}
            className="w-full bg-green-600 text-white font-semibold"
          >
            اذهب للدخول الآن
          </Button>
        </div>
      </div>
    )
  }

  return null
}
