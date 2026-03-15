'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { ChevronLeft, Star, Zap, RotateCcw } from 'lucide-react'

interface Question {
  id: number
  type: 'choice' | 'fill'
  question: string
  options?: string[]
  answer: string
  explanation?: string
}

interface Mistake {
  id: string
  subject: string
  content: string
  knowledgePoint: string
  status: string
  correctStreak: number
}

interface PracticeResult {
  score: number
  total: number
  allCorrect: boolean
  srResult: {
    newStatus: string
    newStreak: number
    message: string
    pointsEarned: number
  }
  detailedResults: Array<{
    questionIndex: number
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }>
}

const SUBJECT_BG: Record<string, string> = {
  '数学': 'from-blue-500 to-blue-600',
  '语文': 'from-purple-500 to-purple-600',
  '英语': 'from-green-500 to-green-600',
}

const STATUS_NEXT_MSG: Record<string, string> = {
  MASTERED: '🏆 完全掌握！',
  REVIEWING_2: '🌟 即将掌握！',
  REVIEWING_1: '✨ 进入复习阶段！',
  PRACTICING: '💪 继续练习！',
}

function PracticeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mistakeId = searchParams.get('mistakeId')

  const [mistake, setMistake] = useState<Mistake | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [fillAnswer, setFillAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [comboCount, setComboCount] = useState(0)
  const [showComboAnim, setShowComboAnim] = useState(false)

  useEffect(() => {
    if (mistakeId) {
      fetchPractice()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mistakeId])

  async function fetchPractice() {
    try {
      const res = await fetch(`/api/practice?mistakeId=${mistakeId}`)
      const data = await res.json()
      setMistake(data.mistake)
      setQuestions(data.questions)
    } catch (err) {
      console.error('Failed to fetch practice:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleOptionSelect(option: string) {
    if (showFeedback) return
    setSelectedAnswer(option)
  }

  function handleConfirm() {
    if (showFeedback) return
    const currentQuestion = questions[currentIndex]
    const answer = currentQuestion.type === 'fill' ? fillAnswer : selectedAnswer
    if (!answer) return

    const correct = answer.trim() === currentQuestion.answer.trim()
    setIsCorrect(correct)
    setShowFeedback(true)

    if (correct) {
      const newCombo = comboCount + 1
      setComboCount(newCombo)
      if (newCombo >= 3) {
        setShowComboAnim(true)
        setTimeout(() => setShowComboAnim(false), 2000)
      }
    } else {
      setComboCount(0)
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setFillAnswer('')
      setShowFeedback(false)
      setIsCorrect(false)
    } else {
      submitPractice()
    }
  }

  async function submitPractice() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mistakeId,
          questions: questions,
          answers: answers,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error('Failed to submit practice:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!mistakeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">没有选择练习题</p>
          <button onClick={() => router.push('/mistakes')} className="btn-primary">
            去选择错题
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-bounce">⚡</div>
          <p className="text-xl font-bold">生成练习题中...</p>
        </div>
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-spin">⚙️</div>
          <p className="text-xl font-bold">判分中...</p>
        </div>
      </div>
    )
  }

  // 结果页
  if (result) {
    const scoreRate = Math.round((result.score / result.total) * 100)
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-500 pb-24">
        {/* Header */}
        <div className="px-5 pt-12 pb-6 text-white text-center">
          <div className="text-6xl mb-3 animate-bounce-in">
            {result.allCorrect ? '🏆' : scoreRate >= 60 ? '⭐' : '💪'}
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {result.allCorrect ? '全部正确！' : `得分 ${scoreRate}%`}
          </h2>
          <p className="text-blue-100">{result.srResult.message}</p>
        </div>

        <div className="bg-slate-50 rounded-t-3xl px-5 pt-6 min-h-[65vh]">
          {/* Score card */}
          <div className="card mb-5 text-center">
            <div className="flex items-center justify-center gap-8 mb-4">
              <div>
                <div className="text-3xl font-bold text-blue-600">{result.score}</div>
                <div className="text-xs text-slate-400">答对</div>
              </div>
              <div className="text-2xl text-slate-300">/</div>
              <div>
                <div className="text-3xl font-bold text-slate-400">{result.total}</div>
                <div className="text-xs text-slate-400">总题数</div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="bg-slate-100 rounded-full h-4 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  scoreRate >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' 
                  : 'bg-gradient-to-r from-orange-400 to-orange-500'
                }`}
                style={{ width: `${scoreRate}%` }}
              />
            </div>
            
            {/* Points earned */}
            <div className="flex items-center justify-center gap-2 bg-yellow-50 rounded-2xl py-2 px-4">
              <Star size={18} className="text-yellow-500" fill="currentColor" />
              <span className="font-bold text-yellow-700">
                +{result.srResult.pointsEarned} 积分
              </span>
            </div>
          </div>

          {/* Status update */}
          <div className={`card mb-5 border-2 ${
            result.srResult.newStatus === 'MASTERED' 
              ? 'border-green-200 bg-green-50' 
              : 'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {STATUS_NEXT_MSG[result.srResult.newStatus]?.split(' ')[0]}
              </div>
              <div>
                <p className="font-bold text-slate-700">
                  {STATUS_NEXT_MSG[result.srResult.newStatus]}
                </p>
                <p className="text-sm text-slate-500">
                  连续全对：{result.srResult.newStreak} 次
                </p>
              </div>
            </div>
          </div>

          {/* Detailed results */}
          <div className="card mb-5">
            <h3 className="font-bold text-slate-700 mb-3">答题详情</h3>
            <div className="space-y-2">
              {result.detailedResults.map((r, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    r.isCorrect ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className={`text-xl ${r.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {r.isCorrect ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">第 {idx + 1} 题</p>
                    {!r.isCorrect && (
                      <p className="text-xs text-red-500">
                        正确答案：{r.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setResult(null)
                setCurrentIndex(0)
                setAnswers([])
                setSelectedAnswer(null)
                setFillAnswer('')
                setShowFeedback(false)
                setComboCount(0)
              }}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold bg-slate-200 text-slate-600 active:scale-95 transition-all"
            >
              <RotateCcw size={18} />
              再练一次
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 btn-primary"
            >
              🏠 回首页
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const bgGradient = SUBJECT_BG[mistake?.subject || '数学'] || 'from-blue-500 to-blue-600'
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} pb-24`}>
      {/* Combo animation */}
      {showComboAnim && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center h-screen pointer-events-none">
          <div className="text-center animate-bounce-in">
            <div className="text-6xl mb-2">🔥🔥🔥</div>
            <div className="text-3xl font-black text-white drop-shadow-lg">连胜 {comboCount}!</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-12 pb-4 text-white">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white/20">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-sm opacity-80">{mistake?.subject} · {mistake?.knowledgePoint}</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <Zap size={14} className="text-orange-300" />
            <span className="text-sm font-bold text-orange-200">x{comboCount}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-bold opacity-90">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Question area */}
      <div className="bg-slate-50 rounded-t-3xl px-5 pt-6 min-h-[70vh]">
        
        {/* Question */}
        <div className="card mb-5">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0">
              Q{currentIndex + 1}
            </div>
            <p className="text-lg font-medium text-slate-700 leading-relaxed">
              {currentQuestion?.question}
            </p>
          </div>
        </div>

        {/* Options (for choice type) */}
        {currentQuestion?.type === 'choice' && currentQuestion.options && (
          <div className="space-y-3 mb-5">
            {currentQuestion.options.map((option, idx) => {
              let optionStyle = 'bg-white border-2 border-slate-200 text-slate-700'
              
              if (showFeedback) {
                if (option === currentQuestion.answer) {
                  optionStyle = 'bg-green-500 border-2 border-green-500 text-white'
                } else if (option === selectedAnswer && !isCorrect) {
                  optionStyle = 'bg-red-500 border-2 border-red-500 text-white animate-shake'
                } else {
                  optionStyle = 'bg-slate-100 border-2 border-slate-200 text-slate-400'
                }
              } else if (selectedAnswer === option) {
                optionStyle = 'bg-blue-500 border-2 border-blue-500 text-white shadow-md'
              }

              const letters = ['A', 'B', 'C', 'D']
              
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-2xl text-left flex items-center gap-3 transition-all duration-200 active:scale-98 ${optionStyle}`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0 ${
                    showFeedback && option === currentQuestion.answer ? 'bg-white/20' :
                    selectedAnswer === option ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {letters[idx]}
                  </span>
                  <span className="font-medium">{option}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Fill in blank */}
        {currentQuestion?.type === 'fill' && (
          <div className="mb-5">
            <input
              value={fillAnswer}
              onChange={e => setFillAnswer(e.target.value)}
              disabled={showFeedback}
              placeholder="在这里输入答案..."
              className={`w-full p-4 rounded-2xl text-lg border-2 focus:outline-none transition-all ${
                showFeedback
                  ? isCorrect
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-red-400 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white focus:border-blue-400'
              }`}
            />
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className={`card mb-5 border-2 animate-bounce-in ${
            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{isCorrect ? '🎉' : '💡'}</div>
              <div>
                <p className={`font-bold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? '答对了！+1 积分 ⭐' : '答错了，别灰心！'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-slate-600 mb-1">
                    正确答案：<span className="font-bold text-green-600">{currentQuestion?.answer}</span>
                  </p>
                )}
                {currentQuestion?.explanation && (
                  <p className="text-sm text-slate-500">{currentQuestion.explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action button */}
        {!showFeedback ? (
          <button
            onClick={handleConfirm}
            disabled={!selectedAnswer && !fillAnswer}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all ${
              selectedAnswer || fillAnswer
                ? 'btn-primary'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            确认答案
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-accent w-full py-5 text-lg"
          >
            {currentIndex < questions.length - 1 ? '下一题 →' : '查看结果 🎯'}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-bounce">⚡</div>
          <p className="text-xl font-bold">加载中...</p>
        </div>
      </div>
    }>
      <PracticeContent />
    </Suspense>
  )
}
