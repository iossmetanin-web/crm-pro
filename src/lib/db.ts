import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if we're in demo mode (Vercel without database connection)
// Demo mode is enabled when:
// 1. DEMO_MODE is explicitly set to 'true'
// 2. DATABASE_URL is not set
// 3. DATABASE_URL contains 'file:' (SQLite) and we're in Vercel/production
const isDemoMode = process.env.DEMO_MODE === 'true' || 
  !process.env.DATABASE_URL ||
  (process.env.VERCEL === '1' && process.env.DATABASE_URL?.startsWith('file:'))

let _db: PrismaClient | null = null

if (!isDemoMode) {
  try {
    _db = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })
    
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _db
    }
  } catch (error) {
    console.warn('Database connection failed, using demo mode:', error)
  }
}

export const db = _db
export const isDemo = isDemoMode || !_db
