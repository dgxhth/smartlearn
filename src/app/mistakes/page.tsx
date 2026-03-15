'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { BookOpen, Filter, Search, ChevronRight, Plus, Calendar } from 'lucide-react'

interface Mistake {
  id: string
  subject: string
  content: string
  knowledgePoint: string
  status: string
  correctStreak: number
  nextReviewAt: string | null
  createdAt: string
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
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  PRACTICING: 'bg-orange-100 text-orange-700 border-orange-200',
  REVIEWING_1: 'bg-purple-100 text-purple-700 border-purple-200',
  REVIEWING_2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MASTERED: 'bg-green-100 text-green-700 border-green-200',
}

const STATUS_ICONS: Record<string, string> = {
  NEW: '🆕',
  PRACTICING: '💪',
  REVIEWING_1: '🔄',
  REVIEWING_2: '🔄',
  MASTERED: '✅',
}

const FILTERS = ['全部', '数学', '语文', '英语']
const STATUS_FILTERS = ['全部', 'NEW', 'PRACTICING', 'REVIEWING_1', 'REVIEWING_2', 'MASTERED']

function MistakeSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="flex gap-1">
                {[0, 1, 2].map(j => (
                  <div key={j} className="w-4 h-4 bg-slate-200 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function isDueForReview(mistake: Mistake): boolean {
  if (mistake.status === 'MASTERED') return false
  if (mistake.status === 'NEW' || mistake.status === 'PRACTICING') return true
  if (!mistake.nextReviewAt) return true
  return new Date(mistake.nextReviewAt) <= new Date()
}

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [filtered, setFiltered] = useState<Mistake[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState('全部')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [searchText, setSearchText] = useState('')
  const [showStatusFilter, setShowStatusFilter] = useState(false)

  useEffect(() => {
    fetchMistakes()
  }, [])

  useEffect(() => {
    let result = mistakes
    if (subjectFilter !== '全部') {
      result = result.filter(m => m.subject === subjectFilter)
    }
    if (statusFilter !== '全部') {
      result = result.filter(m => m.status === statusFilter)
    }
    if (searchText) {
      const lower = searchText.toLowerCase()
      result = result.filter(m =>
        m.content.toLowerCase().includes(lower) ||
        m.knowledgePoint.toLowerCase().includes(lower)
      )
    }
    setFiltered(result)
  }, [mistakes, subjectFilter, statusFilter, searchText])

  async function fetchMistakes() {
    try {
      const res = await fetch('/api/mistakes')
      const data = await res.json()
      setMistakes(data.mistakes || [])
    } catch (err) {
      console.error('Failed to fetch mistakes:', err)
    } finally {
      setLoading(false)
    }
  }

  const masteredCount = mistakes.filter(m => m.status === 'MASTERED').length
  const totalCount = mistakes.length
  const dueCount = mistakes.filter(isDueForReview).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen size={22} />
            <h1 className="text-xl font-bold">我的错题库</h1>
          </div>
          <Link href="/upload">
            <button className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-2 text-sm font-medium transition-all active:scale-95 min-h-[36px]">
              <Plus size={16} />
              添加
            </button>
          </Link>
        </div>
        <div className="flex items-center gap-3 text-purple-100 text-sm">
          <span>共 {totalCount} 道</span>
          <span>·</span>
          <span>已掌握 {masteredCount} 道</span>
          {dueCount > 0 && (
            <>
              <span>·</span>
              <span className="text-orange-300 font-medium">⚡{dueCount} 题待练</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-1000"
            style={{ width: `${totalCount > 0 ? (masteredCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="px-5 py-4 pb-24">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索题目或知识点..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-slate-700"
          />
        </div>

        {/* Subject filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setSubjectFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all active:scale-95 min-h-[36px] ${
                subjectFilter === f
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {f !== '全部' ? `${SUBJECT_EMOJIS[f]} ${f}` : f}
            </button>
          ))}
          <button
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-1 active:scale-95 min-h-[36px] ${
              statusFilter !== '全部'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Filter size={14} />
            状态
          </button>
        </div>

        {/* Status filter */}
        {showStatusFilter && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setShowStatusFilter(false) }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 min-h-[32px] ${
                  statusFilter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {f === '全部' ? '全部状态' : `${STATUS_ICONS[f]} ${STATUS_LABELS[f]}`}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-slate-400 mb-3">显示 {filtered.length} 道题</p>

        {/* Mistakes list */}
        {loading ? (
          <MistakeSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{searchText ? '🔍' : '📚'}</div>
            <p className="text-slate-500 font-medium mb-2">
              {searchText ? '没有找到匹配的错题' : '还没有错题'}
            </p>
            <p className="text-slate-400 text-sm mb-6">
              {!searchText && mistakes.length === 0
                ? '上传你的第一道错题，开始智能练习吧！'
                : searchText
                ? '试试其他关键词'
                : '换个筛选条件试试'}
            </p>
            {mistakes.length === 0 && (
              <Link href="/upload">
                <button className="btn-primary">📷 上传第一道错题</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((mistake) => {
              const due = isDueForReview(mistake)
              return (
                <div key={mistake.id} className={`card ${due && mistake.status !== 'MASTERED' ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl mt-0.5">
                      {SUBJECT_EMOJIS[mistake.subject] || '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`badge text-xs border ${STATUS_COLORS[mistake.status] || ''}`}>
                          {STATUS_ICONS[mistake.status]} {STATUS_LABELS[mistake.status] || mistake.status}
                        </span>
                        <span className="text-xs text-slate-400 truncate">{mistake.knowledgePoint}</span>
                        {due && mistake.status !== 'MASTERED' && (
                          <span className="text-xs text-orange-500 font-medium">🔔 待练</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2 mb-2">{mistake.content}</p>

                      {/* Streak indicator */}
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all ${
                              i < mistake.correctStreak ? 'bg-green-400' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-slate-400 ml-1">
                          连胜 {mistake.correctStreak}/3
                        </span>
                      </div>

                      {/* Next review date */}
                      {mistake.nextReviewAt && mistake.status !== 'MASTERED' && (
                        <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                          <Calendar size={11} />
                          复习时间：{new Date(mistake.nextReviewAt).toLocaleDateString('zh-CN')}
                        </p>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="flex-shrink-0">
                      {mistake.status !== 'MASTERED' && (
                        <Link href={`/practice?mistakeId=${mistake.id}`}>
                          <button className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all min-h-[36px] ${
                            due ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                          }`}>
                            练习 <ChevronRight size={14} />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
