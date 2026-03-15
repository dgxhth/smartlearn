export type MistakeStatus = 'NEW' | 'PRACTICING' | 'REVIEWING_1' | 'REVIEWING_2' | 'MASTERED'

export interface Question {
  id: number
  type: 'choice' | 'fill'
  question: string
  options?: string[]
  answer: string
  explanation?: string
}

export interface Mistake {
  id: string
  userId: string
  subject: string
  imageUrl?: string | null
  content: string
  knowledgePoint: string
  status: MistakeStatus
  correctStreak: number
  nextReviewAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Practice {
  id: string
  userId: string
  mistakeId: string
  questions: Question[]
  answers: string[]
  score: number
  total: number
  allCorrect: boolean
  createdAt: Date
}

export interface User {
  id: string
  name: string
  grade: string
  avatar?: string | null
  totalPoints: number
  streak: number
  lastStudyAt?: Date | null
}

export const STATUS_LABELS: Record<MistakeStatus, string> = {
  NEW: '新题',
  PRACTICING: '练习中',
  REVIEWING_1: '复习1',
  REVIEWING_2: '复习2',
  MASTERED: '已掌握',
}

export const STATUS_COLORS: Record<MistakeStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  PRACTICING: 'bg-orange-100 text-orange-700',
  REVIEWING_1: 'bg-purple-100 text-purple-700',
  REVIEWING_2: 'bg-yellow-100 text-yellow-700',
  MASTERED: 'bg-green-100 text-green-700',
}

export const SUBJECT_EMOJIS: Record<string, string> = {
  '数学': '🔢',
  '语文': '📖',
  '英语': '🌍',
}
