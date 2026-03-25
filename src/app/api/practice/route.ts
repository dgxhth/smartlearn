import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQuestionsWithFallback } from '@/lib/geminiService'
import { calculateNextState } from '@/lib/spacedRepetition'
import { MistakeStatus } from '@/lib/types'

const DEMO_USER_ID = 'user-demo-001'

// GET /api/practice?mistakeId=xxx&regenerate=true → 获取/生成题目
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mistakeId = searchParams.get('mistakeId')
    const regenerate = searchParams.get('regenerate')

    if (!mistakeId) {
      return NextResponse.json({ error: 'mistakeId is required' }, { status: 400 })
    }

    const mistake = await prisma.mistake.findUnique({
      where: { id: mistakeId },
    })

    if (!mistake) {
      return NextResponse.json({ error: 'Mistake not found' }, { status: 404 })
    }

    // 1. 如果有缓存且不强制重新生成，直接返回缓存题目（最快）
    if (regenerate !== 'true' && mistake.cachedQuestions) {
      try {
        const questions = JSON.parse(mistake.cachedQuestions)
        return NextResponse.json({
          mistake,
          questions,
          fromCache: true,
          fromQuestionBank: false,
        })
      } catch {
        console.warn('Failed to parse cachedQuestions,降级到题库查找...')
      }
    }

    // 2. 尝试从题库查找（同一科目+知识点的历史题目）
    if (regenerate !== 'true') {
      const bankEntry = await prisma.questionBank.findUnique({
        where: {
          userId_subject_knowledgePoint: {
            userId: DEMO_USER_ID,
            subject: mistake.subject,
            knowledgePoint: mistake.knowledgePoint,
          },
        },
      })
      if (bankEntry) {
        const questions = JSON.parse(bankEntry.questions)
        // 同时更新错题的缓存，方便下次快速命中
        await prisma.mistake.update({
          where: { id: mistakeId },
          data: { cachedQuestions: bankEntry.questions },
        })
        return NextResponse.json({
          mistake,
          questions,
          fromCache: false,
          fromQuestionBank: true,
        })
      }
    }

    // 3. 题库也没有，需要重新生成（这次生成会同时入库）
    const questions = await generateQuestionsWithFallback(
      mistake.subject,
      mistake.knowledgePoint,
      mistake.content
    )
    const questionsJson = JSON.stringify(questions)

    // 更新错题缓存
    await prisma.mistake.update({
      where: { id: mistakeId },
      data: { cachedQuestions: questionsJson },
    })

    // 同时存入题库（如果还没有的话）
    await prisma.questionBank.upsert({
      where: {
        userId_subject_knowledgePoint: {
          userId: DEMO_USER_ID,
          subject: mistake.subject,
          knowledgePoint: mistake.knowledgePoint,
        },
      },
      update: { questions: questionsJson },
      create: {
        userId: DEMO_USER_ID,
        subject: mistake.subject,
        knowledgePoint: mistake.knowledgePoint,
        questions: questionsJson,
        sourceMistakeId: mistakeId,
      },
    })

    return NextResponse.json({
      mistake,
      questions,
      fromCache: false,
      fromQuestionBank: false,
      newlyGenerated: true,
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
    const { mistakeId, questions, answers, userId } = body

    const actualUserId = userId || DEMO_USER_ID

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
        userId: actualUserId,
        mistakeId,
        questions: JSON.stringify(questions),
        answers: JSON.stringify(answers),
        score,
        total,
        allCorrect,
      },
    })

    // 更新错题状态（注意：不清除 cachedQuestions，题库存题目，反复练习不重新生成）
    await prisma.mistake.update({
      where: { id: mistakeId },
      data: {
        status: srResult.newStatus,
        correctStreak: srResult.newStreak,
        nextReviewAt: srResult.nextReviewAt,
        // cachedQuestions 不再清除！题库里有，反复用
      },
    })

    // 更新用户积分和学习时间
    await prisma.user.update({
      where: { id: actualUserId },
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
