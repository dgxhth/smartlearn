import { GoogleGenerativeAI } from '@google/generative-ai'
import { Question } from './types'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

/**
 * 带重试的 Gemini API 调用
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}

/**
 * 解析 Gemini 返回的 JSON（去掉可能的 markdown 代码块）
 */
function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// =============================================
// 1. AI 图像识别
// =============================================

export interface RecognitionResult {
  subject: string
  content: string
  knowledgePoint: string
  confidence: number  // 0-1, 置信度
  rawText?: string    // 原始识别文字
}

export async function recognizeImage(
  imageBase64: string,
  mimeType: string,
  subjectHint?: string
): Promise<RecognitionResult> {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const subjectInstructions = subjectHint
      ? `用户提示科目是：${subjectHint}。`
      : '请自动判断科目（数学/语文/英语）。'

    const prompt = `你是一个专业的中学题目识别专家。请分析这张图片中的题目。

${subjectInstructions}

请返回以下 JSON 格式（仅返回JSON，不要其他文字）：
{
  "subject": "数学|语文|英语",
  "content": "完整的题目内容（保留原题格式）",
  "knowledgePoint": "具体知识点（例如：一元一次方程、三角形内角和、一般过去时等）",
  "confidence": 0.95,
  "rawText": "图片中识别到的所有文字"
}

注意：
- subject 只能是 数学、语文、英语 三选一
- content 尽量完整还原题目，包括选项（如果有）
- knowledgePoint 要具体，不要太宽泛
- confidence 表示你对识别结果的置信度（0-1）`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      { text: prompt },
    ])

    const responseText = result.response.text()
    const parsed = parseJSON<RecognitionResult>(responseText)

    // 验证必填字段
    if (!parsed.subject || !parsed.content || !parsed.knowledgePoint) {
      throw new Error('Invalid recognition result')
    }

    // 确保 subject 合法
    if (!['数学', '语文', '英语'].includes(parsed.subject)) {
      parsed.subject = subjectHint || '数学'
    }

    return parsed
  })
}

// =============================================
// 2. AI 出题
// =============================================

const SUBJECT_PROMPTS: Record<string, string> = {
  数学: `出题规则：
- 核心原则：每知识点出5道题！不是总共5道！
- 题型比例：填空题≥60%，其余为判断题和少量选择题
- 填空题：用___表示空白处，答案为简洁数字或表达式
- 判断题：针对易错概念出题，答案为"正确"或"错误"
- 选择题：最多1道，4个选项要有迷惑性
- 题目趣味性：用生活化场景出题，不要干巴巴的公式
- 难度递进：5道题按 易→中→难 排列`,

  语文: `出题规则：
- 核心原则：每知识点出5道题！不是总共5道！
- 题型比例：填空题≥60%，其余为判断题和少量选择题
- 填空题：答案为简洁词语或短句
- 判断题：针对文学常识或语法规则出题
- 选择题：最多1道，选项要有代表性
- 题目趣味性：结合课文内容和日常生活
- 难度递进：5道题按 识记→理解→运用 排列`,

  英语: `出题规则：
- 核心原则：每知识点出5道题！不是总共5道！
- 题型比例：填空题≥60%（语法填空为主），其余为判断题和少量选择题
- 填空题：答案为单词、短语或句子
- 判断题：针对语法规则或常见错误出题
- 选择题：最多1道
- 题目趣味性：用真实情境对话出题
- 难度递进：5道题按 基础→综合→拓展 排列`,
}

export async function generateQuestions(
  subject: string,
  knowledgePoint: string,
  originalContent: string
): Promise<Question[]> {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const subjectPrompt = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS['数学']

    // 拆分多个知识点
    const knowledgePoints = knowledgePoint
      .split(/[、,，\n]/)
      .map(k => k.trim())
      .filter(k => k.length > 0)

    // 核心改变：每个知识点出5道题，不是总共5道
    const QUESTIONS_PER_POINT = 5
    const knowledgePointsText = knowledgePoints.length > 1
      ? `多个知识点（必须严格遵循！每个知识点出${QUESTIONS_PER_POINT}道）：\n${knowledgePoints.map((k, i) => `  知识点${i + 1}：${k}`).join('\n')}`
      : `知识点：${knowledgePoint}（请出${QUESTIONS_PER_POINT}道练习题）`

    const prompt = `你是一位超级有趣的中学生${subject}老师，请根据以下信息出题：

【重要规则】每个知识点必须出${QUESTIONS_PER_POINT}道题！如果${knowledgePoints.length > 1 ? '有多个知识点则总题数为：知识点数 × ' + QUESTIONS_PER_POINT + ' = ' + (knowledgePoints.length * QUESTIONS_PER_POINT) + '道' : '只有1个知识点则出' + QUESTIONS_PER_POINT + '道'}！

原题内容：${originalContent}
${knowledgePointsText}
科目：${subject}

${subjectPrompt}

题型要求（必须满足）：
- 填空题（fill）≥60%！这是最重要的题型！
- 其余为判断题（truefalse），最多1道选择题（choice）
- 填空题（fill）：用___表示空白处，答案为简洁数字/词语/短句
- 判断题（truefalse）：固定options=["正确","错误"]，answer为"正确"或"错误"
- 选择题（choice）：最多1道，必须恰好4个选项

请返回以下 JSON 格式（仅返回JSON，不要其他文字）：
[
  {
    "knowledgePoint": "该题对应的知识点（用于语音解读）",
    "id": 1,
    "type": "fill",
    "question": "完整填空题目，用___表示空白处",
    "answer": "正确答案",
    "explanation": "详细解题解析，说清楚为什么是这个答案"
  },
  {
    "knowledgePoint": "该题对应的知识点",
    "id": 2,
    "type": "truefalse",
    "question": "判断题目陈述是否正确",
    "options": ["正确", "错误"],
    "answer": "正确或错误",
    "explanation": "详细解释"
  }
]

重要要求：
1. 每${QUESTIONS_PER_POINT}道题对应一个知识点，严格按顺序排列
2. 选择题最多1道，填空题占多数
3. explanation要像朋友讲题一样亲切生动，不要干巴巴的
4. 题目要贴合生活实际，有趣味性
5. 所有知识点都要均匀覆盖`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const questions = parseJSON<Question[]>(responseText)

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format')
    }

    // 验证和修正每道题，按知识点分组
    let globalId = 1
    const finalQuestions: Question[] = []
    for (let kpIdx = 0; kpIdx < knowledgePoints.length; kpIdx++) {
      const kpQuestions = questions.filter((_, qIdx) => {
        // 每个知识点5道题，按顺序分配
        return qIdx >= kpIdx * QUESTIONS_PER_POINT && qIdx < (kpIdx + 1) * QUESTIONS_PER_POINT
      })
      kpQuestions.forEach((q) => {
        const type = q.type === 'fill' ? 'fill' : q.type === 'truefalse' ? 'truefalse' : 'choice'
        if (type === 'fill') {
          finalQuestions.push({
            id: globalId++,
            knowledgePoint: knowledgePoints[kpIdx],
            type: 'fill' as const,
            question: q.question || '',
            answer: q.answer || '',
            explanation: q.explanation || '请参考教材',
          })
        } else if (type === 'truefalse') {
          finalQuestions.push({
            id: globalId++,
            knowledgePoint: knowledgePoints[kpIdx],
            type: 'truefalse' as const,
            question: q.question || '',
            options: ['正确', '错误'],
            answer: q.answer === '正确' ? '正确' : '错误',
            explanation: q.explanation || '请参考教材',
          })
        } else {
          finalQuestions.push({
            id: globalId++,
            knowledgePoint: knowledgePoints[kpIdx],
            type: 'choice' as const,
            question: q.question || '',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
            answer: q.answer || '',
            explanation: q.explanation || '请参考教材',
          })
        }
      })
    }
    return finalQuestions
  })
}

// =============================================
// 3. 降级方案：Mock AI（当 Gemini 不可用时）
// =============================================

export async function recognizeImageWithFallback(
  imageBase64: string | null,
  mimeType: string,
  subjectHint?: string
): Promise<RecognitionResult> {
  if (!apiKey) {
    return getMockRecognition(subjectHint)
  }

  if (!imageBase64) {
    return getMockRecognition(subjectHint)
  }

  try {
    return await recognizeImage(imageBase64, mimeType, subjectHint)
  } catch (err) {
    console.error('Gemini recognition failed, using fallback:', err)
    return getMockRecognition(subjectHint)
  }
}

export async function generateQuestionsWithFallback(
  subject: string,
  knowledgePoint: string,
  originalContent: string
): Promise<Question[]> {
  if (!apiKey) {
    return getMockQuestions(subject, knowledgePoint)
  }

  try {
    return await generateQuestions(subject, knowledgePoint, originalContent)
  } catch (err) {
    console.error('Gemini question generation failed, using fallback:', err)
    return getMockQuestions(subject, knowledgePoint)
  }
}

// =============================================
// Fallback Mock 数据
// =============================================

function getMockRecognition(subjectHint?: string): RecognitionResult {
  const subjects = subjectHint ? [subjectHint] : ['数学', '语文', '英语']
  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]

  const mockData: Record<string, Array<{ content: string; knowledgePoint: string }>> = {
    数学: [
      { content: '解方程：2x + 5 = 13，求x的值', knowledgePoint: '一元一次方程' },
      { content: '计算：3² + 4² = ?（提示：利用幂运算）', knowledgePoint: '幂运算' },
      { content: '一个三角形三个内角分别是60°、70°，第三个角是多少度？', knowledgePoint: '三角形内角和' },
      { content: '已知函数 f(x) = 2x + 3，求 f(5) 的值', knowledgePoint: '一次函数' },
    ],
    语文: [
      { content: '下列词语中，加点字读音完全正确的一项是？', knowledgePoint: '字音识别' },
      { content: '《春》是哪位作家的名篇散文？请写出作者名和文章主题', knowledgePoint: '文学常识' },
      { content: '"问渠那得清如许，为有源头活水来"出自哪首诗，作者是谁？', knowledgePoint: '古诗文' },
    ],
    英语: [
      { content: 'Fill in the blank: I _____ (go) to school every day. (一般现在时)', knowledgePoint: '一般现在时' },
      { content: 'Choose the correct answer: She _____ her homework yesterday.\nA. do  B. does  C. did  D. doing', knowledgePoint: '一般过去时' },
      { content: 'Translate: "我昨天去了图书馆" to English.', knowledgePoint: '一般过去时' },
    ],
  }

  const items = mockData[randomSubject] || mockData['数学']
  const randomItem = items[Math.floor(Math.random() * items.length)]

  return {
    subject: randomSubject,
    content: randomItem.content,
    knowledgePoint: randomItem.knowledgePoint,
    confidence: 0.85,
    rawText: randomItem.content,
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMockQuestions(subject: string, _knowledgePoint?: string): Question[] {
  // Mock题目（含多种题型：choice/fill/truefalse）
  const mathQuestions: Question[] = [
    { id: 1, knowledgePoint: '一元一次方程', type: 'choice', question: '解方程：x + 3 = 7，x = ?', options: ['x = 3', 'x = 4', 'x = 10', 'x = -4'], answer: 'x = 4', explanation: 'x + 3 = 7，两边减3，x = 4' },
    { id: 2, knowledgePoint: '一元一次方程', type: 'fill', question: '解方程：2x = 10，x = ___', answer: '5', explanation: '两边除以2，x = 5' },
    { id: 3, knowledgePoint: '一元一次方程', type: 'choice', question: '解方程：3x - 6 = 9，x = ?', options: ['x = 1', 'x = 3', 'x = 5', 'x = 15'], answer: 'x = 5', explanation: '3x = 15，x = 5' },
    { id: 4, knowledgePoint: '一元一次方程', type: 'truefalse', question: '方程 2x + 3 = 7 的解是 x = 3', options: ['正确', '错误'], answer: '错误', explanation: '2x = 4，x = 2，所以 x = 3 是错误的' },
    { id: 5, knowledgePoint: '一元一次方程', type: 'fill', question: '若 x + 5 = 12，则 2x = ___', answer: '14', explanation: 'x = 7，2x = 14' },
  ]

  const englishQuestions: Question[] = [
    { id: 1, knowledgePoint: '一般现在时', type: 'choice', question: 'She _____ (go) to school every day.', options: ['go', 'goes', 'going', 'went'], answer: 'goes', explanation: '第三人称单数用goes' },
    { id: 2, knowledgePoint: '一般现在时', type: 'fill', question: 'They _____ (play) football on weekends. 请填入正确形式', answer: 'play', explanation: 'they是复数，用动词原形play' },
    { id: 3, knowledgePoint: '一般现在时', type: 'choice', question: 'My father _____ (work) in a hospital.', options: ['work', 'works', 'working', 'worked'], answer: 'works', explanation: 'My father是单数，works' },
    { id: 4, knowledgePoint: '一般现在时', type: 'truefalse', question: '"He don\'t like apples." 这句话语法正确。', options: ['正确', '错误'], answer: '错误', explanation: '第三人称单数否定句应用doesn\'t，不是don\'t' },
    { id: 5, knowledgePoint: '一般现在时', type: 'fill', question: 'The cat _____ (sleep) on the sofa. 请填入正确形式', answer: 'sleeps', explanation: 'The cat是单数，sleeps' },
  ]

  const chineseQuestions: Question[] = [
    { id: 1, knowledgePoint: '文学常识', type: 'choice', question: '《春》的作者是谁？', options: ['鲁迅', '朱自清', '老舍', '巴金'], answer: '朱自清', explanation: '《春》是朱自清的著名散文' },
    { id: 2, knowledgePoint: '文学常识', type: 'fill', question: '《背影》的作者是___', answer: '朱自清', explanation: '《背影》是朱自清1925年写的散文' },
    { id: 3, knowledgePoint: '文学常识', type: 'choice', question: '《故乡》的作者是？', options: ['郭沫若', '茅盾', '鲁迅', '巴金'], answer: '鲁迅', explanation: '《故乡》是鲁迅1921年写的小说' },
    { id: 4, knowledgePoint: '文学常识', type: 'truefalse', question: '《静夜思》是杜甫的作品。', options: ['正确', '错误'], answer: '错误', explanation: '《静夜思》是唐代诗人李白的作品，不是杜甫' },
    { id: 5, knowledgePoint: '古诗文', type: 'fill', question: '"问渠那得清如许"出自朱熹的《___》', answer: '观书有感', explanation: '出自宋代朱熹的《观书有感》' },
  ]

  const qMap: Record<string, Question[]> = { '数学': mathQuestions, '英语': englishQuestions, '语文': chineseQuestions }
  return qMap[subject] || mathQuestions
}
