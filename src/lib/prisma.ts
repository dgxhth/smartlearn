import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync, copyFileSync } from 'fs'
import path from 'path'

function getDbUrl(): string {
  // Vercel serverless: 用/tmp目录（可写）
  if (process.env.VERCEL) {
    const tmpDb = '/tmp/smartlearn.db'
    if (!existsSync(tmpDb)) {
      // 尝试从构建产物复制seed数据库
      const buildDb = path.join(process.cwd(), 'prisma', 'dev.db')
      if (existsSync(buildDb)) {
        copyFileSync(buildDb, tmpDb)
      } else {
        // 创建新数据库
        try {
          execSync(`npx prisma db push --skip-generate`, {
            env: { ...process.env, DATABASE_URL: `file:${tmpDb}` },
            cwd: process.cwd(),
          })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_err) {
          console.log('DB push in /tmp failed, will auto-create on first query')
        }
      }
    }
    return `file:${tmpDb}`
  }
  return process.env.DATABASE_URL || 'file:./dev.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = getDbUrl()
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
