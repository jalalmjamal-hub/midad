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

  // 1️⃣ التحقق من الحالة عند تحميل الصفحة
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
        setTimeout(() => {
          router.push('/sign-in')
        }, 2000)
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
    // التحقق من الحقول
    if (!email.trim()) {
      addMessage('البريد الإلكتروني مطلوب', 'error')
      return
    }
    if (!name.trim()) {
      addMessage('اسم المسؤول مطلوب', 'error')
      return
    }
    if (password.length < 8) {
      addMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error')
      return
    }
    if (passwordStrength === 'weak') {
      addMessage('كلمة المرور ضعيفة. استخدم حروف كبيرة وصغيرة وأرقام', 'error')
      return
    }

    setIsLoading(true)
    setStep('loading')
    setMessages([])

    try {
      addMessage('🔐 يتم التحقق من صحة البيانات...', 'info')
      
      addMessage('📤 يتم إرسال البيانات إلى الخادم...', 'info')
      setStep('loading')

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

      addMessage('✅ تم التحقق من الهوية بنجاح', 'success')
      addMessage('💾 يتم حفظ البيانات...', 'info')
      
      addMessage('✅ تم إنشاء حساب المسؤول بنجاح! 🎉', 'success')
      addMessage(`البريد الإلكتروني: ${data.user.email}`, 'info')
      addMessage(`الاسم: ${data.user.name}`, 'info')
      addMessage(`الدور: مسؤول النظام (Manager)`, 'info')

      setStep('success')
      
      // إعادة التوجيه بعد 3 ثواني
      setTimeout(() => {
        router.push('/sign-in')
      }, 3000)

    } catch (error) {
      addMessage(
        `❌ خطأ: ${error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}`,
        'error'
      )
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  // عرض حالة التحميل الأولى
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

  // عرض الخطأ في الفحص
  if (step === 'error' && !setupState?.setupComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
            <h1 className="text-2xl font-bold text-destructive mb-4">❌ خطأ</h1>
            <div className="space-y-3 mb-6">
              {messages.map((msg, idx) => (
                <p key={idx} className="text-sm text-foreground">
                  {msg.text}
                </p>
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

  // عرض صيغة الإنشاء
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
        <div className="max-w-2xl mx-auto">
          {/* الرأس */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">🔐 إعداد النظام</h1>
            <p className="text-muted-foreground text-lg">إنشاء حساب المسؤول الأول</p>
          </div>

          {/* البطاقة الرئيسية */}
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8 mb-6">
            <div className="space-y-6">
              {/* حقل الاسم */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  👤 اسم المسؤول
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  disabled={isLoading}
                />
              </div>

              {/* حقل البريد */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  📧 البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  dir="ltr"
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  disabled={isLoading}
                />
              </div>

              {/* حقل كلمة المرور */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground">
                    🔑 كلمة المرور
                  </label>
                  <span className={`text-xs font-medium ${
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
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  disabled={isLoading}
                />
                <div className="mt-3 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                  <p className="font-medium mb-2">✓ متطلبات كلمة المرور:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>
                      8 أحرف على الأقل
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                      حرف كبير واحد (A-Z)
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                      حرف صغير واحد (a-z)
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                      رقم واحد (0-9)
                    </li>
                  </ul>
                </div>
              </div>

              {/* زر الإنشاء */}
              <Button
                onClick={createAdmin}
                disabled={isLoading || !email || !password || !name}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition h-12"
              >
                {isLoading ? '⏳ جاري الإنشاء...' : '✓ إنشاء حساب المسؤول'}
              </Button>
            </div>
          </div>

          {/* رسائل التقدم */}
          {messages.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">📋 سجل العملية:</h3>
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 text-sm ${
                    msg.type === 'error' ? 'text-destructive' :
                    msg.type === 'success' ? 'text-green-600' :
                    'text-muted-foreground'
                  }`}>
                    <span className="flex-shrink-0">
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

          {/* ملاحظات الأمان */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-bold">🔒 ملاحظة أمان:</span> احفظ بيانات المسؤول الأول في مكان آمن. هذه الصفحة ستصبح غير متاحة بعد الإنشاء.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // عرض حالة التحميل
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 animate-spin text-4xl">⏳</div>
          <h1 className="text-2xl font-bold mb-4">جاري إنشاء الحساب...</h1>
          <div className="space-y-2 mb-6">
            {messages.map((msg, idx) => (
              <p key={idx} className="text-sm text-muted-foreground">
                {msg.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // عرض حالة النجاح
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 text-6xl animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-green-900 mb-2">تم بنجاح!</h1>
          <p className="text-green-800 mb-6">تم إنشاء حساب المسؤول بنجاح</p>
          
          <div className="bg-white rounded-lg border border-green-200 p-6 mb-6 text-left space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-sm text-foreground">
                <span className="font-medium">{msg.text}</span>
              </div>
            ))}
          </div>

          <p className="text-green-800 text-sm mb-2">
            سيتم تحويلك لصفحة تسجيل الدخول خلال قليل...
          </p>
          <Button
            onClick={() => router.push('/sign-in')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            اذهب للدخول الآن
          </Button>
        </div>
      </div>
    )
  }

  return null
}
