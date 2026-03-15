import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMockQuestions } from '@/lib/mockAI'
import { calculateNextState } from '@/lib/spacedRepetition'
import { MistakeStatus } from '@/lib/types'

const DEMO_USER_ID = 'user-demo-001'

// GET /api/practice?mistakeId=xxx → 获取题目
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mistakeId = searchParams.get('mistakeId')

    if (!mistakeId) {
      return NextResponse.json({ error: 'mistakeId is required' }, { status: 400 })
    }

    const mistake = await prisma.mistake.findUnique({
      where: { id: mistakeId },
    })

    if (!mistake) {
      return NextResponse.json({ error: 'Mistake not found' }, { status: 404 })
    }

    // 生成练习题
    const questions = generateMockQuestions(mistake.subject, mistake.knowledgePoint)

    return NextResponse.json({
      mistake,
      questions,
    })
  } catch (error) {
    console.error('GET /api/practice error:', error)
    return NextResponse.json({ error: 'Failed to get practice' }, { status: 500 })
  }
}

// POST /api/practice → 提交答案
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mistakeId, questions, answers } = body

    const mistake = await prisma.mistake.findUnique({
      where: { id: mistakeId },
    })

    if (!mistake) {
      return NextResponse.json({ error: 'Mistake not found' }, { status: 404 })
    }

    // 判分
    let score = 0
    const total = questions.length
    const detailedResults = questions.map((q: { answer: string }, idx: number) => {
      const userAnswer = answers[idx] || ''
      const isCorrect = userAnswer.trim() === q.answer.trim()
      if (isCorrect) score++
      return {
        questionIndex: idx,
        userAnswer,
        correctAnswer: q.answer,
        isCorrect,
      }
    })

    const allCorrect = score === total

    // 计算新状态（间隔重复算法）
    const srResult = calculateNextState(
      mistake.status as MistakeStatus,
      mistake.correctStreak,
      allCorrect
    )

    // 保存练习记录
    const practice = await prisma.practice.create({
      data: {
        userId: DEMO_USER_ID,
        mistakeId,
        questions: JSON.stringify(questions),
        answers: JSON.stringify(answers),
        score,
        total,
        allCorrect,
      },
    })

    // 更新错题状态
    await prisma.mistake.update({
      where: { id: mistakeId },
      data: {
        status: srResult.newStatus,
        correctStreak: srResult.newStreak,
        nextReviewAt: srResult.nextReviewAt,
      },
    })

    // 更新用户积分
    await prisma.user.update({
      where: { id: DEMO_USER_ID },
      data: {
        totalPoints: { increment: srResult.pointsEarned },
        lastStudyAt: new Date(),
      },
    })

    return NextResponse.json({
      practice,
      score,
      total,
      allCorrect,
      detailedResults,
      srResult,
      newStatus: srResult.newStatus,
    })
  } catch (error) {
    console.error('POST /api/practice error:', error)
    return NextResponse.json({ error: 'Failed to submit practice' }, { status: 500 })
  }
}
