import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEMO_USER_ID = 'user-demo-001'

// GET /api/practice/next → 获取下一道到期复习的题目
export async function GET() {
  try {
    const now = new Date()

    const nextMistake = await prisma.mistake.findFirst({
      where: {
        userId: DEMO_USER_ID,
        status: { notIn: ['MASTERED'] },
        OR: [
          { status: 'NEW' },
          { status: 'PRACTICING' },
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
      orderBy: [
        // 优先：到期的复习题
        { nextReviewAt: 'asc' },
        // 其次：最老的新题
        { createdAt: 'asc' },
      ],
    })

    if (!nextMistake) {
      return NextResponse.json({
        found: false,
        message: '暂无待练习题目，休息一下或上传新题吧！',
      })
    }

    return NextResponse.json({
      found: true,
      mistake: nextMistake,
    })
  } catch (error) {
    console.error('GET /api/practice/next error:', error)
    return NextResponse.json({ error: 'Failed to get next practice' }, { status: 500 })
  }
}
