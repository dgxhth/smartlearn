import { NextResponse } from 'next/server'
import { recognizeImageWithFallback } from '@/lib/geminiService'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const subject = formData.get('subject') as string | null
    const useMock = formData.get('useMock') === 'true'

    let imageBase64: string | null = null
    let mimeType = 'image/jpeg'
    let imageUrl: string | null = null

    // 处理真实图片文件
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer()
      imageBase64 = Buffer.from(buffer).toString('base64')
      mimeType = file.type || 'image/jpeg'
      // 用 base64 data URL 作为预览（实际可上传到 OSS）
      imageUrl = `data:${mimeType};base64,${imageBase64}`
    }

    // useMock 模式不传图片（让 geminiService 内部降级到 mock）
    const base64ToUse = useMock ? null : imageBase64

    const result = await recognizeImageWithFallback(
      base64ToUse,
      mimeType,
      subject || undefined
    )

    return NextResponse.json({
      success: true,
      recognized: {
        subject: result.subject,
        content: result.content,
        knowledgePoint: result.knowledgePoint,
        confidence: result.confidence,
        imageUrl,
      },
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
