'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import {
  Flame, Star, Target, TrendingUp, ChevronRight, Zap, Bell,
  Upload as UploadIcon
} from 'lucide-react'

interface Stats {
  totalMistakes: number
  masteredCount: number
  practicingCount: number
  todayPractices: number
  dueForReviewCount: number
  subjectStats: Record<string, { total: number; mastered: number }>
}

interface UserData {
  id: string
  name: string
  grade: string
  avatar: string
  totalPoints: number
  streak: number
}

interface Mistake {
  id: string
  subject: string
  content: string
  knowledgePoint: string
  status: string
  correctStreak: number
  nextReviewAt: string | null
}

const SUBJECT_EMOJIS: Record<string, string> = {
  '数学': '🔢',
  '语文': '📖',
  '英语': '🌍',
}

const STATUS_LABELS: Record<string, string> = {
  NEW: '新题',
  PRACTICING: '练习中',
  REVIEWING_1: '复习1',
  REVIEWING_2: '复习2',
  MASTERED: '已掌握',
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  PRACTICING: 'bg-orange-100 text-orange-700',
  REVIEWING_1: 'bg-purple-100 text-purple-700',
  REVIEWING_2: 'bg-yellow-100 text-yellow-700',
  MASTERED: 'bg-green-100 text-green-700',
}

// 骨架屏组件
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
  )
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 via-blue-400 to-slate-50">
      <div className="px-5 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-4 w-16 mb-2 bg-blue-400" />
            <Skeleton className="h-7 w-32 bg-blue-400" />
          </div>
          <Skeleton className="w-20 h-16 rounded-2xl bg-blue-400" />
        </div>
        <Skeleton className="h-14 rounded-2xl bg-blue-400" />
      </div>
      <div className="bg-slate-50 rounded-t-3xl px-5 pt-6 pb-24">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-3xl" />)}
        </div>
        <Skeleton className="h-28 rounded-3xl mb-6" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingMistakes, setPendingMistakes] = useState<Mistake[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [userRes, mistakesRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/mistakes'),
      ])
      const userData = await userRes.json()
      const mistakesData = await mistakesRes.json()

      setUserData(userData.user)
      setStats(userData.stats)

      // 待练习：按复习优先级排序
      const now = new Date()
      const allMistakes: Mistake[] = mistakesData.mistakes || []
      const pending = allMistakes
        .filter((m: Mistake) => {
          if (m.status === 'MASTERED') return false
          if (m.status === 'NEW' || m.status === 'PRACTICING') return true
          if (!m.nextReviewAt) return true
          return new Date(m.nextReviewAt) <= now
        })
        .slice(0, 5)
      setPendingMistakes(pending)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <HomeSkeleton />

  const masteryRate = stats && stats.totalMistakes > 0
    ? Math.round((stats.masteredCount / stats.totalMistakes) * 100)
    : 0

  const dueCount = stats?.dueForReviewCount || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 via-blue-400 to-slate-50">
      {/* Header */}
      <div className="px-5 pt-12 pb-8 text-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-blue-100 text-sm">你好，</p>
            <h1 className="text-2xl font-bold">
              {userData?.avatar} {userData?.name}
            </h1>
            <p className="text-blue-100 text-sm">{userData?.grade} · 加油！</p>
          </div>
          <Link href="/settings">
            <div className="text-center bg-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-all active:scale-95">
              <div className="flex items-center gap-1 text-yellow-300">
                <Star size={18} fill="currentColor" />
                <span className="text-xl font-bold">{userData?.totalPoints || 0}</span>
              </div>
              <p className="text-xs text-blue-100">积分</p>
            </div>
          </Link>
        </div>

        {/* Streak + due review notice */}
        <div className="flex items-center gap-2 bg-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
          <Flame className="text-orange-300" size={24} />
          <div>
            <span className="font-bold text-lg">{userData?.streak || 0}</span>
            <span className="text-blue-100 ml-1">天连续学习</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {dueCount > 0 && (
              <div className="flex items-center gap-1 bg-orange-400/80 rounded-full px-2.5 py-1">
                <Bell size={12} className="text-white" />
                <span className="text-xs font-bold text-white">{dueCount} 题待复习</span>
              </div>
            )}
            <div className="text-sm text-blue-100">
              今日 <span className="font-bold text-white">{stats?.todayPractices || 0}</span> 题
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-slate-50 rounded-t-3xl px-5 pt-6 pb-24 min-h-[60vh]">

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{stats?.totalMistakes || 0}</div>
            <div className="text-xs text-slate-500 mt-1">错题总数</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-500">{stats?.masteredCount || 0}</div>
            <div className="text-xs text-slate-500 mt-1">已掌握</div>
          </div>
          <div className="card text-center">
            <div className={`text-2xl font-bold ${dueCount > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
              {dueCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">待练习</div>
          </div>
        </div>

        {/* Mastery Progress */}
        {stats && stats.totalMistakes > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-blue-500" />
                <span className="font-bold text-slate-700">总体掌握度</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{masteryRate}%</span>
            </div>
            <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${masteryRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>还差 {stats.totalMistakes - stats.masteredCount} 题</span>
              <span>目标 100%</span>
            </div>
          </div>
        )}

        {/* Subject Stats */}
        {stats?.subjectStats && Object.keys(stats.subjectStats).length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-orange-500" />
              <span className="font-bold text-slate-700">各科目进度</span>
            </div>
            {Object.entries(stats.subjectStats).map(([subject, data]) => (
              <div key={subject} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-600">
                    {SUBJECT_EMOJIS[subject]} {subject}
                  </span>
                  <span className="text-xs text-slate-400">
                    {data.mastered}/{data.total} 掌握
                  </span>
                </div>
                <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${data.total > 0 ? (data.mastered / data.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/upload">
            <button className="w-full bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 text-left shadow-lg active:scale-95 transition-all min-h-[96px]">
              <div className="text-2xl mb-2">
                <UploadIcon size={28} />
              </div>
              <div className="font-bold">上传错题</div>
              <div className="text-blue-100 text-xs mt-0.5">AI拍照识别</div>
            </button>
          </Link>

          {dueCount > 0 ? (
            <Link href={`/practice?mistakeId=${pendingMistakes[0]?.id}`}>
              <button className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-4 text-left shadow-lg active:scale-95 transition-all min-h-[96px]">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-bold">开始练习</div>
                <div className="text-orange-100 text-xs mt-0.5">{dueCount} 题待练</div>
              </button>
            </Link>
          ) : (
            <div className="w-full bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-4 text-left shadow-lg min-h-[96px]">
              <div className="text-2xl mb-2">🎉</div>
              <div className="font-bold">全部完成！</div>
              <div className="text-green-100 text-xs mt-0.5">休息或上传新题</div>
            </div>
          )}
        </div>

        {/* Pending Mistakes List */}
        {pendingMistakes.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-orange-500" />
                <span className="font-bold text-slate-700">待练习错题</span>
              </div>
              <Link href="/mistakes" className="text-blue-500 text-sm font-medium flex items-center gap-0.5">
                查看全部 <ChevronRight size={16} />
              </Link>
            </div>
            <div className="space-y-2">
              {pendingMistakes.map((mistake) => (
                <Link key={mistake.id} href={`/practice?mistakeId=${mistake.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 active:scale-98 transition-all min-h-[56px]">
                    <div className="text-2xl">{SUBJECT_EMOJIS[mistake.subject] || '📝'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{mistake.content}</p>
                      <p className="text-xs text-slate-400 truncate">{mistake.knowledgePoint}</p>
                    </div>
                    <span className={`badge text-xs flex-shrink-0 ${STATUS_COLORS[mistake.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABELS[mistake.status] || mistake.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {pendingMistakes.length === 0 && stats?.totalMistakes === 0 && (
          <div className="text-center py-12">
            <div className="text-7xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">还没有错题</h3>
            <p className="text-slate-400 text-sm mb-6">
              上传你的第一道错题<br/>SmartLearn 帮你智能复习！
            </p>
            <Link href="/upload">
              <button className="btn-primary">📷 上传第一道错题</button>
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
