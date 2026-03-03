import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if we're in demo mode (Vercel without database)
const isDemoMode = process.env.DEMO_MODE === 'true' || 
  !process.env.DATABASE_URL || 
  process.env.DATABASE_URL === 'file:./dev.db'

// In demo mode, we don't need Prisma
let _db: PrismaClient | null = null

export const db = isDemoMode ? null : (
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
)

if (!isDemoMode && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db as PrismaClient
}

export const isDemo = isDemoMode
