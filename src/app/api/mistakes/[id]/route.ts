import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mistake = await prisma.mistake.findUnique({
      where: { id: params.id },
      include: {
        practices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!mistake) {
      return NextResponse.json({ error: 'Mistake not found' }, { status: 404 })
    }

    return NextResponse.json({ mistake })
  } catch (error) {
    console.error('GET /api/mistakes/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch mistake' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const mistake = await prisma.mistake.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({ mistake })
  } catch (error) {
    console.error('PATCH /api/mistakes/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update mistake' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 先删除关联的练习记录
    await prisma.practice.deleteMany({
      where: { mistakeId: params.id },
    })
    // 再删除错题
    await prisma.mistake.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/mistakes/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete mistake' }, { status: 500 })
  }
}
