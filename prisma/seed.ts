import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 清理旧数据
  await prisma.practice.deleteMany()
  await prisma.mistake.deleteMany()
  await prisma.user.deleteMany()

  // 创建测试用户
  const user = await prisma.user.create({
    data: {
      id: 'user-demo-001',
      name: '小明',
      grade: '初一',
      avatar: '🧑‍🎓',
      totalPoints: 156,
      streak: 5,
    },
  })

  console.log('✅ 创建用户:', user.name)

  // 创建错题数据
  const mistakes = [
    {
      id: 'mistake-001',
      userId: user.id,
      subject: '数学',
      content: '解方程：2x + 5 = 13',
      knowledgePoint: '一元一次方程',
      status: 'MASTERED',
      correctStreak: 3,
    },
    {
      id: 'mistake-002',
      userId: user.id,
      subject: '数学',
      content: '计算：3² + 4² = ?',
      knowledgePoint: '幂运算',
      status: 'REVIEWING_1',
      correctStreak: 1,
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
    },
    {
      id: 'mistake-003',
      userId: user.id,
      subject: '英语',
      content: 'Fill in the blank: I _____ (go) to school every day.',
      knowledgePoint: '一般现在时',
      status: 'PRACTICING',
      correctStreak: 0,
    },
    {
      id: 'mistake-004',
      userId: user.id,
      subject: '语文',
      content: '下列词语中，加点字读音完全正确的一项是？',
      knowledgePoint: '字音识别',
      status: 'NEW',
      correctStreak: 0,
    },
    {
      id: 'mistake-005',
      userId: user.id,
      subject: '数学',
      content: '一个三角形三个内角的和是多少度？',
      knowledgePoint: '三角形内角和',
      status: 'REVIEWING_2',
      correctStreak: 2,
      nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
    },
    {
      id: 'mistake-006',
      userId: user.id,
      subject: '英语',
      content: 'Translate: "我昨天去了图书馆"',
      knowledgePoint: '一般过去时',
      status: 'PRACTICING',
      correctStreak: 1,
    },
    {
      id: 'mistake-007',
      userId: user.id,
      subject: '语文',
      content: '《春》的作者是谁？',
      knowledgePoint: '文学常识',
      status: 'MASTERED',
      correctStreak: 3,
    },
  ]

  for (const mistake of mistakes) {
    await prisma.mistake.create({ data: mistake })
  }

  console.log('✅ 创建错题:', mistakes.length, '条')

  // 创建练习记录
  const practices = [
    {
      userId: user.id,
      mistakeId: 'mistake-001',
      questions: JSON.stringify([
        { id: 1, type: 'choice', question: '解方程：x + 3 = 7', options: ['x=3', 'x=4', 'x=5', 'x=10'], answer: 'x=4' },
      ]),
      answers: JSON.stringify(['x=4']),
      score: 5,
      total: 5,
      allCorrect: true,
    },
    {
      userId: user.id,
      mistakeId: 'mistake-003',
      questions: JSON.stringify([
        { id: 1, type: 'choice', question: 'She _____ a teacher.', options: ['am', 'is', 'are', 'be'], answer: 'is' },
      ]),
      answers: JSON.stringify(['are']),
      score: 3,
      total: 5,
      allCorrect: false,
    },
  ]

  for (const practice of practices) {
    await prisma.practice.create({ data: practice })
  }

  console.log('✅ 创建练习记录:', practices.length, '条')
  console.log('🎉 数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
