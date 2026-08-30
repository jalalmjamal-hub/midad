# 🔐 مداد - منصة الخدمات الذكية

منصة تطبيق متقدمة لإدارة طلبات الفحص وإصدار شهادات الضمان.

## 🚀 الخطوات السريعة للدخول

### المرحلة 1️⃣: إعداد قاعدة البيانات

#### الخيار 1: Docker (الأسهل)
```bash
docker run --name midad-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=midad -p 5432:5432 -d postgres:16
```

#### الخيار 2: PostgreSQL محلي
```bash
# macOS
brew install postgresql
brew services start postgresql

# Linux (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# حمّل من: https://www.postgresql.org/download/windows/

# بعد التثبيت، أنشئ قاعدة البيانات
createdb midad
```

---

### المرحلة 2️⃣: إعداد متغيرات البيئة

```bash
# انسخ الملف النموذجي
cp .env.example .env.local

# عدّل `.env.local` مع بيانات قاعدتك:
```

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/midad
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-super-secret-key-here
NODE_ENV=development
```

**⚠️ ملاحظة أمان:**
- لا تستخدم `password` كحقيقي - غيّره إلى شيء قوي
- غيّر `BETTER_AUTH_SECRET` في الإنتاج
- لا تلتزم `.env.local` في Git

---

### المرحلة 3️⃣: تثبيت والتشغيل

```bash
# 1. تثبيت المكتبات
pnpm install

# 2. تطبيق الهجرات على قاعدة البيانات
pnpm drizzle-kit push:pg

# 3. تشغيل خادم التطوير
pnpm dev
```

---

### المرحلة 4️⃣: إنشاء المسؤول الأول

افتح المتصفح:

```
http://localhost:3000/setup
```

**ستظهر صفحة آمنة تطلب:**
- 👤 اسم المسؤول
- 📧 البريد الإلكتروني
- 🔑 كلمة المرور (قوية جداً)

**مثال على كلمة مرور قوية:**
```
Admin@123456
```

⚠️ **احفظ هذه البيانات في مكان آمن!**

---

### المرحلة 5️⃣: تسجيل الدخول

بعد إنشاء المسؤول، افتح:

```
http://localhost:3000/sign-in
```

**أدخل:**
- البريد الإلكتروني الذي أنشأته
- كلمة المرور

---

## 📍 المسارات المتاحة

| المسار | الوصف |
|-------|-------|
| `/` | الصفحة الرئيسية (محمي) |
| `/setup` | إنشاء المسؤول الأول |
| `/sign-in` | تسجيل الدخول |
| `/dashboard` | لوحة التحكم (قريباً) |
| `/orders` | إدارة الطلبات (قريباً) |
| `/api/setup/create-admin` | API لإنشاء المسؤول |

---

## 🔧 الأدوات والتقنيات

```json
{
  "Framework": "Next.js 16",
  "Language": "TypeScript",
  "Database": "PostgreSQL + Drizzle ORM",
  "Auth": "Better Auth",
  "Styling": "Tailwind CSS",
  "UI Components": "shadcn/ui",
  "Package Manager": "pnpm"
}
```

---

## 🐛 استكشاف الأخطاء

### خطأ: `Error: connect ECONNREFUSED 127.0.0.1:5432`
**الحل:** قاعدة البيانات لم تبدأ
```bash
# تأكد من أن PostgreSQL يعمل
sudo systemctl status postgresql  # Linux
brew services list                # macOS
```

### خطأ: `relation "user" does not exist`
**الحل:** الهجرات لم تطبق
```bash
pnpm drizzle-kit push:pg
```

### خطأ: `Invalid email or password`
**الحل:** تحقق من بيانات الدخول - البريد أو كلمة المرور خاطئة

### خطأ: `BETTER_AUTH_SECRET is required`
**الحل:** أضف `BETTER_AUTH_SECRET` في `.env.local`

---

## 📱 النسخة الإنتاجية

### النشر على Vercel

```bash
# 1. ادفع الكود إلى GitHub
git push origin main

# 2. انسخ المشروع إلى Vercel
# https://vercel.com/new

# 3. أضف متغيرات البيئة في لوحة Vercel:
# - DATABASE_URL
# - BETTER_AUTH_URL (مثل: https://your-domain.vercel.app)
# - BETTER_AUTH_SECRET
# - NODE_ENV=production
```

---

## 📞 المساعدة

إذا واجهت مشكلة:

1. تحقق من السجلات: `pnpm dev` وابحث عن الخطأ
2. تأكد من `.env.local` صحيح
3. تأكد من PostgreSQL يعمل
4. جرب مسح `node_modules` وأعد التثبيت:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

---

**آخر تحديث:** 2026-08-30
