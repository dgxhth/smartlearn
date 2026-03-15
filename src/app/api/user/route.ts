import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEMO_USER_ID = 'user-demo-001'

export async function GET() {
  try {
    let user = await prisma.user.findUnique({
      where: { id: DEMO_USER_ID },
      include: {
        mistakes: true,
        practices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) {
      // 自动创建demo用户
      user = await prisma.user.create({
        data: {
          id: DEMO_USER_ID,
          name: '小明',
          grade: '初一',
          avatar: '🧑‍🎓',
          totalPoints: 0,
          streak: 0,
        },
        include: {
          mistakes: true,
          practices: true,
        },
      })
    }

    // 计算统计数据
    const totalMistakes = user.mistakes.length
    const masteredCount = user.mistakes.filter(m => m.status === 'MASTERED').length
    const practicingCount = user.mistakes.filter(m => 
      ['NEW', 'PRACTICING', 'REVIEWING_1', 'REVIEWING_2'].includes(m.status)
    ).length
    
    // 今日练习数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayPractices = user.practices.filter(p => new Date(p.createdAt) >= today).length

    // 各科目统计
    const subjectStats: Record<string, { total: number; mastered: number }> = {}
    for (const mistake of user.mistakes) {
      if (!subjectStats[mistake.subject]) {
        subjectStats[mistake.subject] = { total: 0, mastered: 0 }
      }
      subjectStats[mistake.subject].total++
      if (mistake.status === 'MASTERED') {
        subjectStats[mistake.subject].mastered++
      }
    }

    return NextResponse.json({
      user,
      stats: {
        totalMistakes,
        masteredCount,
        practicingCount,
        todayPractices,
        subjectStats,
      },
    })
  } catch (error) {
    console.error('GET /api/user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
