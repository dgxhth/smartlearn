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
- 题型：计算题、应用题、公式运用、计算变体、判断题
- 第1-2题：比原题略简单（帮助建立信心）
- 第3题：与原题同等难度
- 第4题以后：比原题略难（巩固提高）
- 每题必须有明确唯一的正确答案
- 填空题：答案为简洁的数字或表达式
- 判断题：针对常见易错概念出题，答案为"正确"或"错误"`,

  语文: `出题规则：
- 题型：字词辨析、阅读理解、文学常识、语法判断、填空
- 第1-2题：字词基础题
- 第3题：理解应用题
- 第4题以后：综合拓展题
- 选择题选项要有迷惑性，但答案必须明确
- 填空题：答案为简洁的词语或短句
- 判断题：针对文学常识或语法规则出题`,

  英语: `出题规则：
- 题型：语法填空、词汇选择、时态判断、翻译改写
- 第1-2题：单一语法点练习
- 第3题：综合应用
- 第4题以后：举一反三变体
- 选择题选项要典型，干扰项要有代表性
- 填空题：答案为单词或短语
- 判断题：针对语法规则或常见错误出题，答案为"正确"或"错误"`,
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

    const hasMultiplePoints = knowledgePoints.length > 1
    const questionCount = knowledgePoints.length >= 3 ? 7 : 5
    const knowledgePointsText = hasMultiplePoints
      ? `多个知识点（需均匀覆盖）：\n${knowledgePoints.map((k, i) => `  ${i + 1}. ${k}`).join('\n')}`
      : `知识点：${knowledgePoint}`

    const prompt = `你是一位专业的中学${subject}老师，请根据以下信息出${questionCount}道练习题：

原题内容：${originalContent}
${knowledgePointsText}
科目：${subject}

${subjectPrompt}

题型要求（必须满足）：
- 题型包含：choice（选择题）、fill（填空题）、truefalse（判断题）
- ${questionCount}题中至少包含2种不同题型
- 选择题（choice）：必须有4个选项，answer为正确选项的完整文字
- 填空题（fill）：无选项，answer为简洁的正确答案
- 判断题（truefalse）：options固定为["正确","错误"]，answer为"正确"或"错误"
${hasMultiplePoints ? `- 均匀覆盖所有${knowledgePoints.length}个知识点，每个知识点至少出1题` : ''}

请返回以下 JSON 格式（仅返回JSON数组，不要其他文字）：
[
  {
    "id": 1,
    "type": "choice",
    "question": "完整题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "正确选项的完整文字（必须与options中某个选项完全一致）",
    "explanation": "详细解题解析，包括解题步骤"
  },
  {
    "id": 2,
    "type": "fill",
    "question": "完整填空题目，用___表示空白处",
    "answer": "正确答案",
    "explanation": "解析"
  },
  {
    "id": 3,
    "type": "truefalse",
    "question": "判断题目陈述是否正确",
    "options": ["正确", "错误"],
    "answer": "正确或错误",
    "explanation": "解析"
  }
]

重要要求：
1. answer 字段对选择题必须与 options 中某个选项的文字完全一致
2. 选择题恰好4个选项，判断题固定2个选项["正确","错误"]
3. 解析要详细，有助于学生理解
4. 题目要多样化，不要重复
5. 难度按1→${questionCount}递进`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    const questions = parseJSON<Question[]>(responseText)

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format')
    }

    // 验证和修正每道题
    return questions.slice(0, questionCount).map((q, idx) => {
      const type = q.type === 'fill' ? 'fill' : q.type === 'truefalse' ? 'truefalse' : 'choice'

      if (type === 'fill') {
        return {
          id: idx + 1,
          type: 'fill' as const,
          question: q.question || `第${idx + 1}题`,
          answer: q.answer || '',
          explanation: q.explanation || '请参考教材',
        }
      } else if (type === 'truefalse') {
        return {
          id: idx + 1,
          type: 'truefalse' as const,
          question: q.question || `第${idx + 1}题`,
          options: ['正确', '错误'],
          answer: q.answer === '正确' ? '正确' : '错误',
          explanation: q.explanation || '请参考教材',
        }
      } else {
        return {
          id: idx + 1,
          type: 'choice' as const,
          question: q.question || `第${idx + 1}题`,
          options: Array.isArray(q.options) && q.options.length === 4
            ? q.options
            : ['A', 'B', 'C', 'D'],
          answer: q.answer || '',
          explanation: q.explanation || '请参考教材',
        }
      }
    })
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
    { id: 1, type: 'choice', question: '解方程：x + 3 = 7，x = ?', options: ['x = 3', 'x = 4', 'x = 10', 'x = -4'], answer: 'x = 4', explanation: 'x + 3 = 7，两边减3，x = 4' },
    { id: 2, type: 'fill', question: '解方程：2x = 10，x = ___', answer: '5', explanation: '两边除以2，x = 5' },
    { id: 3, type: 'choice', question: '解方程：3x - 6 = 9，x = ?', options: ['x = 1', 'x = 3', 'x = 5', 'x = 15'], answer: 'x = 5', explanation: '3x = 15，x = 5' },
    { id: 4, type: 'truefalse', question: '方程 2x + 3 = 7 的解是 x = 3', options: ['正确', '错误'], answer: '错误', explanation: '2x = 4，x = 2，所以 x = 3 是错误的' },
    { id: 5, type: 'fill', question: '若 x + 5 = 12，则 2x = ___', answer: '14', explanation: 'x = 7，2x = 14' },
  ]

  const englishQuestions: Question[] = [
    { id: 1, type: 'choice', question: 'She _____ (go) to school every day.', options: ['go', 'goes', 'going', 'went'], answer: 'goes', explanation: '第三人称单数用goes' },
    { id: 2, type: 'fill', question: 'They _____ (play) football on weekends. 请填入正确形式', answer: 'play', explanation: 'they是复数，用动词原形play' },
    { id: 3, type: 'choice', question: 'My father _____ (work) in a hospital.', options: ['work', 'works', 'working', 'worked'], answer: 'works', explanation: 'My father是单数，works' },
    { id: 4, type: 'truefalse', question: '"He don\'t like apples." 这句话语法正确。', options: ['正确', '错误'], answer: '错误', explanation: '第三人称单数否定句应用doesn\'t，不是don\'t' },
    { id: 5, type: 'fill', question: 'The cat _____ (sleep) on the sofa. 请填入正确形式', answer: 'sleeps', explanation: 'The cat是单数，sleeps' },
  ]

  const chineseQuestions: Question[] = [
    { id: 1, type: 'choice', question: '《春》的作者是谁？', options: ['鲁迅', '朱自清', '老舍', '巴金'], answer: '朱自清', explanation: '《春》是朱自清的著名散文' },
    { id: 2, type: 'fill', question: '《背影》的作者是___', answer: '朱自清', explanation: '《背影》是朱自清1925年写的散文' },
    { id: 3, type: 'choice', question: '《故乡》的作者是？', options: ['郭沫若', '茅盾', '鲁迅', '巴金'], answer: '鲁迅', explanation: '《故乡》是鲁迅1921年写的小说' },
    { id: 4, type: 'truefalse', question: '《静夜思》是杜甫的作品。', options: ['正确', '错误'], answer: '错误', explanation: '《静夜思》是唐代诗人李白的作品，不是杜甫' },
    { id: 5, type: 'fill', question: '"问渠那得清如许"出自朱熹的《___》', answer: '观书有感', explanation: '出自宋代朱熹的《观书有感》' },
  ]

  const qMap: Record<string, Question[]> = { '数学': mathQuestions, '英语': englishQuestions, '语文': chineseQuestions }
  return qMap[subject] || mathQuestions
}
