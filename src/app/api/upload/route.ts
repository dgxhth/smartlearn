import { NextResponse } from 'next/server'
import { mockImageRecognition } from '@/lib/mockAI'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const subject = formData.get('subject') as string | null

    // 模拟AI识别延迟
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock AI识别结果
    const result = mockImageRecognition(subject || undefined)

    // 如果有文件，可以保存（MVP阶段直接返回mock结果）
    let imageUrl: string | null = null
    if (file) {
      // 实际项目中这里应该上传到OSS/S3
      // MVP阶段使用数据URL或跳过
      imageUrl = '/mock-image.jpg'
    }

    return NextResponse.json({
      success: true,
      recognized: {
        ...result,
        imageUrl,
      },
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
