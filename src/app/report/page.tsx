'use client'

import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { BarChart3, Target, TrendingUp, Award, Calendar, Zap } from 'lucide-react'

interface Stats {
  totalMistakes: number
  masteredCount: number
  practicingCount: number
  todayPractices: number
  dueForReviewCount: number
  subjectStats: Record<string, { total: number; mastered: number }>
  statusStats: Record<string, number>
}

interface UserData {
  id: string
  name: string
  grade: string
  avatar: string
  totalPoints: number
  streak: number
}

const SUBJECT_EMOJIS: Record<string, string> = {
  '数学': '🔢',
  '语文': '📖',
  '英语': '🌍',
}

const SUBJECT_COLORS: Record<string, string> = {
  '数学': 'bg-blue-500',
  '语文': 'bg-purple-500',
  '英语': 'bg-green-500',
}

const ACHIEVEMENTS = [
  { id: 1, title: '初学者', desc: '上传第一道错题', emoji: '🌱', threshold: 1, type: 'mistakes' },
  { id: 2, title: '勤奋好学', desc: '积累10道错题', emoji: '📚', threshold: 10, type: 'mistakes' },
  { id: 3, title: '小达人', desc: '掌握5道错题', emoji: '⭐', threshold: 5, type: 'mastered' },
  { id: 4, title: '学霸', desc: '掌握10道错题', emoji: '🏆', threshold: 10, type: 'mastered' },
  { id: 5, title: '积分先锋', desc: '获得100积分', emoji: '💎', threshold: 100, type: 'points' },
  { id: 6, title: '坚持不懈', desc: '连续学习3天', emoji: '🔥', threshold: 3, type: 'streak' },
]

const STATUS_INFO = [
  { label: '新题', key: 'NEW', color: 'bg-blue-400', emoji: '🆕' },
  { label: '练习中', key: 'PRACTICING', color: 'bg-orange-400', emoji: '💪' },
  { label: '复习1', key: 'REVIEWING_1', color: 'bg-purple-400', emoji: '🔄' },
  { label: '复习2', key: 'REVIEWING_2', color: 'bg-yellow-400', emoji: '🔁' },
  { label: '已掌握', key: 'MASTERED', color: 'bg-green-400', emoji: '✅' },
]

export default function ReportPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/user')
      const data = await res.json()
      setUserData(data.user)
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  function isAchievementUnlocked(achievement: typeof ACHIEVEMENTS[0]) {
    if (!stats || !userData) return false
    switch (achievement.type) {
      case 'mistakes': return stats.totalMistakes >= achievement.threshold
      case 'mastered': return stats.masteredCount >= achievement.threshold
      case 'points': return (userData.totalPoints || 0) >= achievement.threshold
      case 'streak': return (userData.streak || 0) >= achievement.threshold
      default: return false
    }
  }

  const masteryRate = stats && stats.totalMistakes > 0
    ? Math.round((stats.masteredCount / stats.totalMistakes) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">📊</div>
          <p className="text-slate-400">加载报告中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 size={22} />
          <h1 className="text-xl font-bold">学习报告</h1>
        </div>
        <p className="text-green-100 text-sm">
          {userData?.avatar} {userData?.name} · {userData?.grade}
        </p>
      </div>

      <div className="px-5 py-5 pb-24 space-y-5">

        {/* Overall stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="opacity-80" />
              <span className="text-sm opacity-80">总体掌握率</span>
            </div>
            <div className="text-3xl font-black">{masteryRate}%</div>
          </div>
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="opacity-80" />
              <span className="text-sm opacity-80">连续学习</span>
            </div>
            <div className="text-3xl font-black">{userData?.streak || 0}天</div>
          </div>
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="opacity-80" />
              <span className="text-sm opacity-80">总积分</span>
            </div>
            <div className="text-3xl font-black">{userData?.totalPoints || 0}</div>
          </div>
          <div className="card bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="opacity-80" />
              <span className="text-sm opacity-80">今日练习</span>
            </div>
            <div className="text-3xl font-black">{stats?.todayPractices || 0}题</div>
          </div>
        </div>

        {/* Subject progress */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-blue-500" />
            <h2 className="font-bold text-slate-700">各科目详情</h2>
          </div>
          {stats?.subjectStats && Object.keys(stats.subjectStats).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.subjectStats).map(([subject, data]) => {
                const rate = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{SUBJECT_EMOJIS[subject] || '📝'}</span>
                        <span className="font-semibold text-slate-700">{subject}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-700">{rate}%</span>
                        <span className="text-xs text-slate-400 ml-1">({data.mastered}/{data.total})</span>
                      </div>
                    </div>
                    <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${SUBJECT_COLORS[subject] || 'bg-slate-400'} h-full rounded-full transition-all duration-1000`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>已掌握 {data.mastered} 题</span>
                      <span>共 {data.total} 题</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <div className="text-4xl mb-2">📊</div>
              <p>暂无数据，去上传错题吧！</p>
            </div>
          )}
        </div>

        {/* Status breakdown - 修复：使用 statusStats */}
        {stats && stats.totalMistakes > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-orange-500" />
              <h2 className="font-bold text-slate-700">错题状态分布</h2>
            </div>
            <div className="space-y-3">
              {STATUS_INFO.map(({ label, key, color, emoji }) => {
                const count = stats.statusStats?.[key] || 0
                const width = stats.totalMistakes > 0 ? (count / stats.totalMistakes) * 100 : 0
                if (count === 0) return null
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-lg w-6">{emoji}</span>
                    <span className="text-sm text-slate-600 w-16 flex-shrink-0">{label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${color} h-full rounded-full transition-all duration-1000`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-yellow-500" />
            <h2 className="font-bold text-slate-700">成就徽章</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = isAchievementUnlocked(achievement)
              return (
                <div
                  key={achievement.id}
                  className={`flex flex-col items-center p-3 rounded-2xl text-center transition-all ${
                    unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200'
                      : 'bg-slate-100 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-1">
                    {unlocked ? achievement.emoji : '🔒'}
                  </div>
                  <div className={`text-xs font-bold ${unlocked ? 'text-orange-700' : 'text-slate-500'}`}>
                    {achievement.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">{achievement.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Spaced repetition info card */}
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🧠</span>
            <h2 className="font-bold text-slate-700">间隔重复学习法</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            基于科学记忆曲线，SmartLearn 自动安排最优复习时机：
          </p>
          <div className="space-y-2">
            {[
              { step: '1', desc: '新题 → 立即练习 (NEW)', color: 'bg-blue-500' },
              { step: '2', desc: '第1次全对 → 1天后复习 (REVIEWING_1)', color: 'bg-purple-500' },
              { step: '3', desc: '第2次全对 → 3天后复习 (REVIEWING_2)', color: 'bg-yellow-500' },
              { step: '4', desc: '第3次全对 → 完全掌握 (MASTERED)!', color: 'bg-green-500' },
              { step: '❌', desc: '任何阶段答错 → 重置到练习中', color: 'bg-red-400' },
            ].map(({ step, desc, color }) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`${color} w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {step}
                </div>
                <span className="text-sm text-slate-600">{desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-100">
            <p className="text-xs text-slate-500">
              💡 连续3次全对可直接跳过中间步骤，快速到达MASTERED状态。
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
