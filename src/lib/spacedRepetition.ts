import { MistakeStatus } from './types'

/**
 * 间隔重复算法
 * 规则：
 * - NEW → 立即练习 (PRACTICING)
 * - PRACTICING → 任何全对变 REVIEWING_1（连续3次全对也直接到MASTERED）
 * - REVIEWING_1 → 全对变 REVIEWING_2 (3天后复习)
 * - REVIEWING_2 → 全对变 MASTERED
 * - 任何阶段答错 → 回到 PRACTICING，correctStreak 重置为0
 * 
 * 连续3次全对 = MASTERED（快速通道）
 */

export interface SpacedRepetitionResult {
  newStatus: MistakeStatus
  newStreak: number
  nextReviewAt: Date | null
  message: string
  pointsEarned: number
}

export function calculateNextState(
  currentStatus: MistakeStatus,
  currentStreak: number,
  allCorrect: boolean
): SpacedRepetitionResult {
  if (!allCorrect) {
    // 答错：回到PRACTICING，重置连胜
    return {
      newStatus: 'PRACTICING',
      newStreak: 0,
      nextReviewAt: null,
      message: '继续加油！重新练习这道题',
      pointsEarned: 1,
    }
  }

  const newStreak = currentStreak + 1

  // 连续3次全对 → 直接MASTERED（快速通道）
  if (newStreak >= 3) {
    return {
      newStatus: 'MASTERED',
      newStreak: 3,
      nextReviewAt: null,
      message: '🎉 太棒了！完全掌握这道题！',
      pointsEarned: 20,
    }
  }

  switch (currentStatus) {
    case 'NEW':
    case 'PRACTICING':
      if (newStreak >= 1) {
        // 第1次全对 → 1天后复习
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + 1)
        return {
          newStatus: 'REVIEWING_1',
          newStreak,
          nextReviewAt: nextReview,
          message: '✨ 很好！明天再来复习一次',
          pointsEarned: 10,
        }
      }
      return {
        newStatus: 'PRACTICING',
        newStreak,
        nextReviewAt: null,
        message: '答对了！继续保持',
        pointsEarned: 5,
      }

    case 'REVIEWING_1':
      if (newStreak >= 2) {
        // 第2次全对 → 3天后复习
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + 3)
        return {
          newStatus: 'REVIEWING_2',
          newStreak,
          nextReviewAt: nextReview,
          message: '🌟 很棒！3天后再来复习',
          pointsEarned: 15,
        }
      }
      return {
        newStatus: 'REVIEWING_1',
        newStreak,
        nextReviewAt: null,
        message: '答对了！',
        pointsEarned: 5,
      }

    case 'REVIEWING_2':
      return {
        newStatus: 'MASTERED',
        newStreak: 3,
        nextReviewAt: null,
        message: '🏆 恭喜！完全掌握这道题！',
        pointsEarned: 20,
      }

    case 'MASTERED':
      return {
        newStatus: 'MASTERED',
        newStreak: 3,
        nextReviewAt: null,
        message: '👍 很好，保持掌握状态！',
        pointsEarned: 5,
      }

    default:
      return {
        newStatus: 'PRACTICING',
        newStreak,
        nextReviewAt: null,
        message: '答对了！',
        pointsEarned: 5,
      }
  }
}

/**
 * 判断题目是否需要复习（到期了）
 */
export function isReadyForReview(
  status: MistakeStatus,
  nextReviewAt: Date | null
): boolean {
  if (status === 'NEW') return true
  if (status === 'PRACTICING') return true
  if (status === 'MASTERED') return false
  if (!nextReviewAt) return true
  return new Date() >= nextReviewAt
}

/**
 * 获取状态进度（0-100）
 */
export function getStatusProgress(status: MistakeStatus, streak: number): number {
  switch (status) {
    case 'NEW': return 0
    case 'PRACTICING': return Math.min(33, streak * 11)
    case 'REVIEWING_1': return 33 + Math.min(33, streak * 11)
    case 'REVIEWING_2': return 66 + Math.min(17, streak * 9)
    case 'MASTERED': return 100
    default: return 0
  }
}
