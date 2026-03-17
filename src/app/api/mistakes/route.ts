import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEMO_USER_ID = 'user-demo-001'

async function ensureUser() {
  try {
    const user = await prisma.user.findUnique({ where: { id: DEMO_USER_ID } })
    if (!user) {
      await prisma.user.create({
        data: {
          id: DEMO_USER_ID,
          name: '小明',
          grade: '初一',
          avatar: '🧑🎓',
          totalPoints: 0,
          streak: 0,
        },
      })
    }
  } catch (e) {
    console.error('ensureUser error:', e)
  }
}

export async function GET(request: Request) {
  try {
    await ensureUser()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')

    const where: Record<string, unknown> = { userId: DEMO_USER_ID }
    if (status) where.status = status
    if (subject) where.subject = subject

    const mistakes = await prisma.mistake.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ mistakes })
  } catch (error) {
    console.error('GET /api/mistakes error:', error)
    return NextResponse.json({ error: 'Failed to fetch mistakes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureUser()
    const body = await request.json()
    const { subject, content, knowledgePoint, imageUrl } = body

    const mistake = await prisma.mistake.create({
      data: {
        userId: DEMO_USER_ID,
        subject,
        content,
        knowledgePoint,
        imageUrl: imageUrl || null,
        status: 'NEW',
        correctStreak: 0,
      },
    })

    return NextResponse.json({ mistake }, { status: 201 })
  } catch (error) {
    console.error('POST /api/mistakes error:', error)
    return NextResponse.json({ error: 'Failed to create mistake' }, { status: 500 })
  }
}
