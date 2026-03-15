# SmartLearn - 个性化学习平台 MVP

## 产品定义
小学生中学生专用的个性化学习网站。学生拍照上传错题或老师要求，AI自动生成游戏化互动练习题，反复练习直到掌握。

## 核心功能需求

### 1. 错题上传
- 支持拍照上传 / 选择图片上传
- AI识别图片中的题目内容（用多模态AI API）
- 自动提取：科目、知识点、题目内容、正确答案

### 2. AI智能出题
- 根据识别的知识点，生成5道同类型变体练习题
- 支持三个科目：语文、数学、英语
- 题型：选择题为主（方便自动判分），填空题辅助
- 难度递进：从简到难

### 3. 游戏化答题界面
- 一题一屏，大按钮，适合手机操作
- 答对：绿色特效 + 积分 +1
- 答错：红色提示 + 显示正确答案和解析
- 进度条显示当前进度（第3/5题）
- 连胜计数器

### 4. 间隔重复系统（核心算法）
```
错题状态：
- NEW: 新上传的错题 → 立即生成练习
- PRACTICING: 做了但还没连续3次全对
- REVIEWING_1: 第1次全对 → 1天后复习
- REVIEWING_2: 第2次全对 → 3天后复习  
- MASTERED: 第3次全对 → 标记掌握 ✅
- 任何阶段答错 → 回到 PRACTICING
```

### 5. 个人仪表盘
- 错题总数 / 已掌握数 / 待练习数
- 今日练习量
- 连续学习天数
- 各科目掌握进度条

## 技术栈
- **框架**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite (本地开发用，简单快速)
- **ORM**: Prisma
- **AI**: 预留API接口，MVP阶段用mock数据演示流程
- **部署**: 本地开发服务器先跑通

## 页面结构
```
/ (首页 - 仪表盘)
├── /upload (上传错题页)
├── /practice (答题页 - 游戏化界面)
├── /mistakes (我的错题库)
└── /report (学习报告)
```

## 数据模型
```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  grade     String   // 年级
  mistakes  Mistake[]
  practices Practice[]
}

model Mistake {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  subject     String   // 语文/数学/英语
  imageUrl    String?  // 上传的图片
  content     String   // AI识别的题目内容
  knowledgePoint String // 知识点
  status      String   @default("NEW") // NEW/PRACTICING/REVIEWING_1/REVIEWING_2/MASTERED
  correctStreak Int    @default(0) // 连续正确次数
  nextReviewAt  DateTime? // 下次复习时间
  createdAt   DateTime @default(now())
  practices   Practice[]
}

model Practice {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  mistakeId  String
  mistake    Mistake  @relation(fields: [mistakeId], references: [id])
  questions  Json     // 生成的题目JSON
  answers    Json     // 学生的答案
  score      Int      // 得分
  total      Int      // 总题数
  allCorrect Boolean  // 是否全对
  createdAt  DateTime @default(now())
}
```

## 设计风格
- 明亮活泼，适合青少年
- 主色调：蓝色 + 橙色点缀
- 大字体，大按钮，触控友好
- 游戏化元素：进度条、星星、火焰连胜图标
- 中文界面

## MVP目标
先用mock数据跑通完整流程：上传→识别→出题→答题→判分→状态更新→仪表盘展示。
AI接口预留，后续接入真实API。

## 开发顺序
1. 项目初始化 + 数据库 + 基础布局
2. 上传页面（图片上传 + mock AI识别）
3. 答题页面（游戏化UI + 判分逻辑）
4. 间隔重复算法
5. 仪表盘 + 错题库
6. 美化 + 动画效果
