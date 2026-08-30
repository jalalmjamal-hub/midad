import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: {
  client: pool
}
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL),
  emailAndPassword: { enabled: true, autoSignIn: true },
  plugins: [admin({ adminRoles: ['manager'], roles: { manager: {} } })],
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development' ? [
      'http://localhost:3000',
      'https://sb-21pp3rxd74do.vercel.run',
      ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
      ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
      ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
      ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
    ] : []),
    ...(process.env.NODE_ENV === 'production' ? [...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [])] : []),
  ],
  user: { additionalFields: { role: { type: 'string', required: false, defaultValue: 'customer' } } },
  ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } } : {}),
})
