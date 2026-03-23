import { Question } from './types'

/**
 * Mock AI题目生成器
 * 根据知识点生成5道练习题
 */

const mathQuestions: Record<string, Question[]> = {
  '一元一次方程': [
    {
      id: 1,
      knowledgePoint: '一元一次方程',
      type: 'choice',
      question: '解方程：x + 3 = 7，x 的值是？',
      options: ['x = 3', 'x = 4', 'x = 10', 'x = -4'],
      answer: 'x = 4',
      explanation: 'x + 3 = 7，两边减3，x = 7 - 3 = 4',
    },
    {
      id: 2,
      knowledgePoint: '一元一次方程',
      type: 'choice',
      question: '解方程：2x = 10，x 的值是？',
      options: ['x = 2', 'x = 5', 'x = 8', 'x = 20'],
      answer: 'x = 5',
      explanation: '2x = 10，两边除以2，x = 10 ÷ 2 = 5',
    },
    {
      id: 3,
      knowledgePoint: '一元一次方程',
      type: 'choice',
      question: '解方程：3x - 6 = 9，x 的值是？',
      options: ['x = 1', 'x = 3', 'x = 5', 'x = 15'],
      answer: 'x = 5',
      explanation: '3x - 6 = 9，两边加6，3x = 15，x = 5',
    },
    {
      id: 4,
      knowledgePoint: '一元一次方程',
      type: 'choice',
      question: '若 x + 5 = 12，则 2x 等于？',
      options: ['7', '12', '14', '24'],
      answer: '14',
      explanation: 'x = 12 - 5 = 7，所以 2x = 14',
    },
    {
      id: 5,
      knowledgePoint: '一元一次方程',
      type: 'choice',
      question: '解方程：4x + 2 = 18，x 的值是？',
      options: ['x = 2', 'x = 4', 'x = 5', 'x = 8'],
      answer: 'x = 4',
      explanation: '4x + 2 = 18，4x = 16，x = 4',
    },
  ],
  '幂运算': [
    {
      id: 1,
      knowledgePoint: '幂运算',
      type: 'choice',
      question: '计算：2³ = ?',
      options: ['6', '8', '9', '12'],
      answer: '8',
      explanation: '2³ = 2×2×2 = 8',
    },
    {
      id: 2,
      knowledgePoint: '幂运算',
      type: 'choice',
      question: '计算：5² = ?',
      options: ['10', '15', '25', '35'],
      answer: '25',
      explanation: '5² = 5×5 = 25',
    },
    {
      id: 3,
      knowledgePoint: '幂运算',
      type: 'choice',
      question: '计算：3² + 4² = ?',
      options: ['14', '25', '30', '49'],
      answer: '25',
      explanation: '3² = 9，4² = 16，9 + 16 = 25',
    },
    {
      id: 4,
      knowledgePoint: '幂运算',
      type: 'choice',
      question: '下面哪个等式是正确的？',
      options: ['2² = 4', '3² = 6', '4² = 8', '5² = 10'],
      answer: '2² = 4',
      explanation: '2² = 2×2 = 4',
    },
    {
      id: 5,
      knowledgePoint: '幂运算',
      type: 'choice',
      question: '计算：10² - 6² = ?',
      options: ['4', '16', '64', '100'],
      answer: '64',
      explanation: '10² = 100，6² = 36，100 - 36 = 64',
    },
  ],
  '三角形内角和': [
    {
      id: 1,
      knowledgePoint: '三角形内角和',
      type: 'choice',
      question: '三角形内角和是多少度？',
      options: ['90°', '180°', '270°', '360°'],
      answer: '180°',
      explanation: '三角形三个内角之和等于180°，这是三角形的基本性质',
    },
    {
      id: 2,
      knowledgePoint: '三角形内角和',
      type: 'choice',
      question: '一个三角形两个角分别是60°和70°，第三个角是多少？',
      options: ['40°', '50°', '60°', '70°'],
      answer: '50°',
      explanation: '180° - 60° - 70° = 50°',
    },
    {
      id: 3,
      knowledgePoint: '三角形内角和',
      type: 'choice',
      question: '等边三角形每个内角是多少度？',
      options: ['45°', '60°', '90°', '120°'],
      answer: '60°',
      explanation: '等边三角形三个角相等，每个角 = 180° ÷ 3 = 60°',
    },
    {
      id: 4,
      knowledgePoint: '三角形内角和',
      type: 'choice',
      question: '直角三角形中，有一个角是90°，另外两个角的和是多少？',
      options: ['45°', '90°', '180°', '270°'],
      answer: '90°',
      explanation: '三角形内角和180°，减去直角90°，剩余两角和 = 90°',
    },
    {
      id: 5,
      knowledgePoint: '三角形内角和',
      type: 'choice',
      question: '三角形最大的内角可以超过多少度？',
      options: ['90°', '120°', '150°', '不超过180°（但必须小于180°）'],
      answer: '不超过180°（但必须小于180°）',
      explanation: '三角形任意一个内角都必须大于0°且小于180°',
    },
  ],
}

const englishQuestions: Record<string, Question[]> = {
  '一般现在时': [
    {
      id: 1,
      knowledgePoint: '一般现在时',
      type: 'choice',
      question: 'She _____ (go) to school every day.',
      options: ['go', 'goes', 'going', 'went'],
      answer: 'goes',
      explanation: '第三人称单数（she）+一般现在时，动词要加-s，go→goes',
    },
    {
      id: 2,
      knowledgePoint: '一般现在时',
      type: 'choice',
      question: 'They _____ (play) football on weekends.',
      options: ['plays', 'playing', 'play', 'played'],
      answer: 'play',
      explanation: '主语they是复数，一般现在时动词不加-s',
    },
    {
      id: 3,
      knowledgePoint: '一般现在时',
      type: 'choice',
      question: 'My father _____ (work) in a hospital.',
      options: ['work', 'works', 'working', 'worked'],
      answer: 'works',
      explanation: 'My father是第三人称单数，动词需加-s，work→works',
    },
    {
      id: 4,
      knowledgePoint: '一般现在时',
      type: 'choice',
      question: 'I _____ (like) reading books.',
      options: ['likes', 'liking', 'like', 'liked'],
      answer: 'like',
      explanation: '主语I用原形动词，like保持不变',
    },
    {
      id: 5,
      knowledgePoint: '一般现在时',
      type: 'choice',
      question: 'The cat _____ (sleep) on the sofa.',
      options: ['sleep', 'sleeps', 'sleeping', 'slept'],
      answer: 'sleeps',
      explanation: 'The cat是第三人称单数，sleep加-s变sleeps',
    },
  ],
  '一般过去时': [
    {
      id: 1,
      knowledgePoint: '一般过去时',
      type: 'choice',
      question: 'I _____ (go) to the library yesterday.',
      options: ['go', 'goes', 'went', 'going'],
      answer: 'went',
      explanation: 'yesterday表示昨天，用一般过去时，go的过去式是went',
    },
    {
      id: 2,
      knowledgePoint: '一般过去时',
      type: 'choice',
      question: 'She _____ (visit) her grandma last week.',
      options: ['visit', 'visits', 'visiting', 'visited'],
      answer: 'visited',
      explanation: 'last week表示上周，用一般过去时，visit加-ed变visited',
    },
    {
      id: 3,
      knowledgePoint: '一般过去时',
      type: 'choice',
      question: 'They _____ (eat) dinner at 7 o\'clock.',
      options: ['eat', 'eats', 'ate', 'eating'],
      answer: 'ate',
      explanation: 'eat的过去式是不规则变化，ate',
    },
    {
      id: 4,
      knowledgePoint: '一般过去时',
      type: 'choice',
      question: 'He _____ (not play) basketball yesterday.',
      options: ['not played', 'didn\'t play', 'doesn\'t play', 'isn\'t play'],
      answer: 'didn\'t play',
      explanation: '一般过去时否定：didn\'t + 动词原形',
    },
    {
      id: 5,
      knowledgePoint: '一般过去时',
      type: 'choice',
      question: '选出一般过去时的句子：',
      options: [
        'She is reading a book.',
        'He will go to school.',
        'They played soccer.',
        'I am happy.',
      ],
      answer: 'They played soccer.',
      explanation: 'played是play的过去式，所以"They played soccer."是一般过去时',
    },
  ],
}

const chineseQuestions: Record<string, Question[]> = {
  '字音识别': [
    {
      id: 1,
      knowledgePoint: '字音识别',
      type: 'choice',
      question: '"家"字的读音是？',
      options: ['jiā', 'jiǎ', 'jiâ', 'jià'],
      answer: 'jiā',
      explanation: '"家"读第一声，jiā，意为家庭、家园',
    },
    {
      id: 2,
      knowledgePoint: '字音识别',
      type: 'choice',
      question: '"重要"中"重"的读音是？',
      options: ['chóng', 'zhòng', 'chòng', 'zhóng'],
      answer: 'zhòng',
      explanation: '重要中的"重"读zhòng（第四声），表示重要、重量',
    },
    {
      id: 3,
      knowledgePoint: '字音识别',
      type: 'choice',
      question: '"参差"中两字的读音是？',
      options: ['cān chā', 'cēn cī', 'shēn chā', 'cān cī'],
      answer: 'cēn cī',
      explanation: '"参差"是固定词语，读cēn cī，形容不整齐',
    },
    {
      id: 4,
      knowledgePoint: '字音识别',
      type: 'choice',
      question: '"学习"中"习"的声调是第几声？',
      options: ['第一声', '第二声', '第三声', '第四声'],
      answer: '第二声',
      explanation: '"习"读xí，第二声（阳平）',
    },
    {
      id: 5,
      knowledgePoint: '字音识别',
      type: 'choice',
      question: '下列词语中读音完全正确的是？',
      options: [
        '朋友(péng yoǔ)',
        '漂亮(piāo liàng)',
        '老师(lǎo shī)',
        '同学(tóng xúe)',
      ],
      answer: '老师(lǎo shī)',
      explanation: '老师：lǎo shī，第三声+第一声，读音正确',
    },
  ],
  '文学常识': [
    {
      id: 1,
      knowledgePoint: '文学常识',
      type: 'choice',
      question: '《春》的作者是谁？',
      options: ['鲁迅', '朱自清', '老舍', '巴金'],
      answer: '朱自清',
      explanation: '《春》是朱自清的著名散文，发表于1933年',
    },
    {
      id: 2,
      knowledgePoint: '文学常识',
      type: 'choice',
      question: '《背影》是哪位作家的名篇？',
      options: ['矛盾', '朱自清', '冰心', '叶圣陶'],
      answer: '朱自清',
      explanation: '《背影》是朱自清1925年所写的回忆性散文',
    },
    {
      id: 3,
      knowledgePoint: '文学常识',
      type: 'choice',
      question: '《故乡》的作者是？',
      options: ['郭沫若', '茅盾', '鲁迅', '巴金'],
      answer: '鲁迅',
      explanation: '《故乡》是鲁迅于1921年写的短篇小说',
    },
    {
      id: 4,
      knowledgePoint: '文学常识',
      type: 'choice',
      question: '唐代诗人李白的代表作是？',
      options: ['《静夜思》', '《春晓》', '《望岳》', '《游子吟》'],
      answer: '《静夜思》',
      explanation: '《静夜思》是李白的著名诗篇，"床前明月光，疑是地上霜"',
    },
    {
      id: 5,
      knowledgePoint: '文学常识',
      type: 'choice',
      question: '"问渠那得清如许，为有源头活水来"出自哪首诗？',
      options: ['《观书有感》', '《春日》', '《梅花》', '《示儿》'],
      answer: '《观书有感》',
      explanation: '出自宋代朱熹的《观书有感》，比喻人要不断学习才能保持进步',
    },
  ],
}

// 通用默认题目
const defaultQuestions: Question[] = [
  {
    id: 1,
    knowledgePoint: '基础知识',
    type: 'choice',
    question: '这道题考察基础知识，下面哪个答案是正确的？',
    options: ['选项A', '选项B（正确）', '选项C', '选项D'],
    answer: '选项B（正确）',
    explanation: '这是示例题目，答案是选项B',
  },
  {
    id: 2,
    knowledgePoint: '几何知识',
    type: 'choice',
    question: '以下哪个说法是正确的？',
    options: ['所有三角形都是等边三角形', '圆的面积=πr²（正确）', '正方形没有直角', '平行四边形的面积=底×高÷2'],
    answer: '圆的面积=πr²（正确）',
    explanation: '圆的面积公式是 S = πr²，其中r是半径',
  },
  {
    id: 3,
    knowledgePoint: '学习方法',
    type: 'choice',
    question: '学习的关键是？',
    options: ['死记硬背', '理解+练习（正确）', '只看不练', '随便学学'],
    answer: '理解+练习（正确）',
    explanation: '学习需要理解知识原理，然后通过练习来巩固',
  },
  {
    id: 4,
    knowledgePoint: '数字比较',
    type: 'choice',
    question: '下面哪个数字最大？',
    options: ['99', '100（正确）', '98', '97'],
    answer: '100（正确）',
    explanation: '100 > 99 > 98 > 97',
  },
  {
    id: 5,
    knowledgePoint: '学习习惯',
    type: 'choice',
    question: '坚持每天学习会有什么效果？',
    options: ['没有效果', '越来越好（正确）', '越来越差', '保持原样'],
    answer: '越来越好（正确）',
    explanation: '坚持每天学习，通过间隔重复，记忆会越来越牢固！',
  },
]

export function generateMockQuestions(
  subject: string,
  knowledgePoint: string
): Question[] {
  let questionPool: Question[] = []

  if (subject === '数学') {
    questionPool = mathQuestions[knowledgePoint] || []
  } else if (subject === '英语') {
    questionPool = englishQuestions[knowledgePoint] || []
  } else if (subject === '语文') {
    questionPool = chineseQuestions[knowledgePoint] || []
  }

  if (questionPool.length === 0) {
    return defaultQuestions
  }

  return questionPool
}

/**
 * Mock AI图像识别
 * 根据科目随机返回一个识别结果
 */
export function mockImageRecognition(subject?: string): {
  subject: string
  content: string
  knowledgePoint: string
} {
  const subjects = subject ? [subject] : ['数学', '语文', '英语']
  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]

  const mockData: Record<string, Array<{ content: string; knowledgePoint: string }>> = {
    数学: [
      { content: '解方程：2x + 5 = 13，求x的值', knowledgePoint: '一元一次方程' },
      { content: '计算：3² + 4²的结果是多少？', knowledgePoint: '幂运算' },
      { content: '一个三角形三个内角分别是60°、70°，第三个角是多少度？', knowledgePoint: '三角形内角和' },
    ],
    语文: [
      { content: '下列词语中，加点字读音完全正确的一项是？', knowledgePoint: '字音识别' },
      { content: '《春》是哪位作家的名篇散文？', knowledgePoint: '文学常识' },
    ],
    英语: [
      { content: 'Fill in the blank: I _____ (go) to school every day.', knowledgePoint: '一般现在时' },
      { content: 'Translate: "我昨天去了图书馆" to English.', knowledgePoint: '一般过去时' },
    ],
  }

  const items = mockData[randomSubject]
  const randomItem = items[Math.floor(Math.random() * items.length)]

  return {
    subject: randomSubject,
    ...randomItem,
  }
}
