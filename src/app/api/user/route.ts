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

    // 更新连续学习天数
    const streak = calculateStreak(user.lastStudyAt)
    if (streak !== user.streak) {
      await prisma.user.update({
        where: { id: DEMO_USER_ID },
        data: { streak },
      })
      user.streak = streak
    }

    // 计算统计数据
    const totalMistakes = user.mistakes.length
    const masteredCount = user.mistakes.filter(m => m.status === 'MASTERED').length
    const practicingCount = user.mistakes.filter(m =>
      ['NEW', 'PRACTICING', 'REVIEWING_1', 'REVIEWING_2'].includes(m.status)
    ).length

    // 今日复习到期的题目
    const now = new Date()
    const dueForReview = user.mistakes.filter(m => {
      if (m.status === 'MASTERED') return false
      if (m.status === 'NEW' || m.status === 'PRACTICING') return true
      if (!m.nextReviewAt) return true
      return new Date(m.nextReviewAt) <= now
    })

    // 今日练习数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayPractices = user.practices.filter(
      p => new Date(p.createdAt) >= today
    ).length

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

    // 各状态统计
    const statusStats: Record<string, number> = {}
    for (const mistake of user.mistakes) {
      statusStats[mistake.status] = (statusStats[mistake.status] || 0) + 1
    }

    return NextResponse.json({
      user,
      stats: {
        totalMistakes,
        masteredCount,
        practicingCount,
        todayPractices,
        dueForReviewCount: dueForReview.length,
        subjectStats,
        statusStats,
      },
    })
  } catch (error) {
    console.error('GET /api/user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH /api/user → 更新用户信息
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { name, grade, avatar } = body

    const user = await prisma.user.update({
      where: { id: DEMO_USER_ID },
      data: {
        ...(name && { name }),
        ...(grade && { grade }),
        ...(avatar && { avatar }),
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('PATCH /api/user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

/**
 * 计算连续学习天数
 */
function calculateStreak(lastStudyAt: Date | null): number {
  if (!lastStudyAt) return 0

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastStudy = new Date(lastStudyAt)
  const lastStudyDay = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate())

  const diffDays = Math.floor((today.getTime() - lastStudyDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 1  // 今天学过，至少1天
  if (diffDays === 1) return 1  // 昨天学过，保持streak
  return 0  // 超过1天没学，streak断了
}
