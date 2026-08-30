import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo, Noto_Naskh_Arabic } from 'next/font/google'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' })
const naskh = Noto_Naskh_Arabic({ subsets: ['arabic'], variable: '--font-naskh' })

export const metadata: Metadata = {
  title: 'مداد | منصة الخدمات الذكية',
  description: 'إدارة طلبات الفحص وإصدار شهادات الضمان من منصة مداد.',
  generator: 'v0.app',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f7f8f6' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" className={`${cairo.variable} ${naskh.variable} bg-background`}><body className="font-sans antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
