import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let initialized = false

export async function ensureDbInitialized() {
  if (initialized) return
  
  try {
    const userCount = await prisma.user.count()
    if (userCount === 0) {
      // 自动seed
      await prisma.user.create({
        data: {
          id: 'user-demo-001',
          name: '小明',
          grade: '初一',
          avatar: '🧑🎓',
          totalPoints: 0,
          streak: 0,
        }
      })
      
      const subjects = [
        { id: 'mistake-001', subject: '数学', content: '解方程：2x + 5 = 13', knowledgePoint: '一元一次方程', status: 'NEW' },
        { id: 'mistake-002', subject: '数学', content: '计算：3² + 4² = ?', knowledgePoint: '幂运算', status: 'NEW' },
        { id: 'mistake-003', subject: '英语', content: 'Fill in the blank: I _____ (go) to school every day.', knowledgePoint: '一般现在时', status: 'NEW' },
        { id: 'mistake-004', subject: '语文', content: '下列词语中，加点字读音完全正确的一项是？', knowledgePoint: '字音识别', status: 'NEW' },
      ]
      
      for (const m of subjects) {
        await prisma.mistake.create({
          data: { ...m, userId: 'user-demo-001' }
        })
      }
    }
    initialized = true
  } catch (e) {
    // DB might not be ready yet, ignore
    console.log('DB init check:', e)
  }
}
