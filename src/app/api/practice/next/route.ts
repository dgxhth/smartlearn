import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEMO_USER_ID = 'user-demo-001'

// Get the next mistake to practice (prioritize due for review, then new, then practicing)
export async function GET() {
  try {
    const now = new Date()
    
    // Priority 1: Due for review
    const reviewing = await prisma.mistake.findFirst({
      where: {
        userId: DEMO_USER_ID,
        status: { in: ['REVIEWING_1', 'REVIEWING_2'] },
        nextReviewAt: { lte: now },
      },
      orderBy: { nextReviewAt: 'asc' },
    })
    
    if (reviewing) {
      return NextResponse.json({ mistake: reviewing, reason: '到期复习' })
    }
    
    // Priority 2: NEW
    const newMistake = await prisma.mistake.findFirst({
      where: {
        userId: DEMO_USER_ID,
        status: 'NEW',
      },
      orderBy: { createdAt: 'desc' },
    })
    
    if (newMistake) {
      return NextResponse.json({ mistake: newMistake, reason: '新题' })
    }
    
    // Priority 3: PRACTICING
    const practicing = await prisma.mistake.findFirst({
      where: {
        userId: DEMO_USER_ID,
        status: 'PRACTICING',
      },
      orderBy: { updatedAt: 'asc' },
    })
    
    if (practicing) {
      return NextResponse.json({ mistake: practicing, reason: '练习中' })
    }
    
    return NextResponse.json({ mistake: null, reason: '全部完成' })
  } catch (error) {
    console.error('GET /api/practice/next error:', error)
    return NextResponse.json({ error: 'Failed to get next practice' }, { status: 500 })
  }
}
