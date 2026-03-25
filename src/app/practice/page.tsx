'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { ChevronLeft, Star, Zap, RotateCcw, Clock, Trophy, Trash2, RefreshCw } from 'lucide-react'

interface Question {
  id: number
  type: 'choice' | 'fill' | 'truefalse'
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
    nextReviewAt?: string | null
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

const STATUS_NEXT_MSG: Record<string, { msg: string; emoji: string }> = {
  MASTERED: { msg: '完全掌握！', emoji: '🏆' },
  REVIEWING_2: { msg: '即将掌握！', emoji: '🌟' },
  REVIEWING_1: { msg: '进入复习阶段！', emoji: '✨' },
  PRACTICING: { msg: '继续练习！', emoji: '💪' },
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

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
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [playedResultSound, setPlayedResultSound] = useState(false)

  // =========== 音效 & 语音系统 ===========
  // Web Audio API 上下文（延迟初始化）
  const audioCtxRef = useRef<AudioContext | null>(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  // 答对音效：清脆叮声
  function playCorrectSound() {
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1) // E6
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  // 答错音效：温和提示音
  function playWrongSound() {
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }

  // 全对欢呼音效
  function playCelebrationSound() {
    try {
      const ctx = getAudioCtx()
      const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12)
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3)
        osc.start(ctx.currentTime + i * 0.12)
        osc.stop(ctx.currentTime + i * 0.12 + 0.3)
      })
    } catch {}
  }

  // 语音朗读解释（Web Speech API）
  function speakExplanation(text: string) {
    try {
      if (!('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = 'zh-CN'
      utt.rate = 1.0
      utt.pitch = 1.1
      // 尝试找一个中文女声
      const trySpeak = (voices: SpeechSynthesisVoice[]) => {
        const zhVoice = voices.find(v => v.lang.includes('zh-CN')) ||
                       voices.find(v => v.lang.includes('zh')) ||
                       voices[0]
        if (zhVoice) utt.voice = zhVoice
        window.speechSynthesis.speak(utt)
      }
      // Chrome需要等待voices加载
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        trySpeak(voices)
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          trySpeak(window.speechSynthesis.getVoices())
        }
      }
    } catch {}
  }

  // 结果页 - 首次渲染时播欢呼
  useEffect(() => {
    if (result && !playedResultSound) {
      setPlayedResultSound(true)
      if (result.allCorrect) {
        playCelebrationSound()
      }
    }
  }, [result, playedResultSound])

  // 计时器
  useEffect(() => {
    if (result) return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [result, startTime])

  useEffect(() => {
    if (mistakeId) fetchPractice()
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

  async function handleRegenerate() {
    setShowRegenerateConfirm(false)
    setRegenerating(true)
    try {
      const res = await fetch(`/api/practice?mistakeId=${mistakeId}&regenerate=true`)
      const data = await res.json()
      setMistake(data.mistake)
      setQuestions(data.questions)
      // 重置所有答题状态
      setCurrentIndex(0)
      setAnswers([])
      setSelectedAnswer(null)
      setFillAnswer('')
      setShowFeedback(false)
      setIsCorrect(false)
      setComboCount(0)
      setResult(null)
    } catch (err) {
      console.error('Failed to regenerate practice:', err)
    } finally {
      setRegenerating(false)
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
      playCorrectSound()
      const newCombo = comboCount + 1
      setComboCount(newCombo)
      if (newCombo >= 3) {
        setShowComboAnim(true)
        setTimeout(() => setShowComboAnim(false), 2500)
      }
    } else {
      playWrongSound()
      setComboCount(0)
    }

    // 答题后自动朗读解析
    if (currentQuestion.explanation) {
      setTimeout(() => speakExplanation(currentQuestion.explanation || ''), 300)
    }

    setAnswers(prev => [...prev, answer])
  }

  const handleNext = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setSelectedAnswer(null)
        setFillAnswer('')
        setShowFeedback(false)
        setIsCorrect(false)
        setIsTransitioning(false)
      } else {
        submitPractice()
      }
    }, 250)
  }, [currentIndex, questions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDeleteQuestion() {
    const newQuestions = questions.filter((_, idx) => idx !== currentIndex)

    if (newQuestions.length === 0) {
      // 没有题目了，直接提交现有答案
      submitPractice()
      return
    }

    const nextIndex = currentIndex >= newQuestions.length
      ? newQuestions.length - 1
      : currentIndex

    setQuestions(newQuestions)
    setCurrentIndex(nextIndex)
    setSelectedAnswer(null)
    setFillAnswer('')
    setShowFeedback(false)
    setIsCorrect(false)
    setShowDeleteConfirm(false)

    // 如果删的是最后一题，提交结果
    if (currentIndex >= newQuestions.length) {
      setTimeout(() => submitPractice(), 100)
    }
  }

  async function submitPractice() {
    setSubmitting(true)
    setIsTransitioning(false)
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mistakeId,
          questions,
          answers,
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

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}分${s}秒` : `${s}秒`
  }

  // =========== 空状态 ===========
  if (!mistakeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-8">
          <div className="text-6xl mb-4">🤔</div>
          <p className="text-slate-500 mb-6 font-medium">没有选择练习题</p>
          <button onClick={() => router.push('/mistakes')} className="btn-primary">
            去错题库选择
          </button>
        </div>
      </div>
    )
  }

  // =========== 加载状态 ===========
  if (loading || regenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600">
        <div className="text-center text-white space-y-4">
          <div className="text-6xl animate-bounce">{regenerating ? '🔄' : '⚡'}</div>
          <h2 className="text-xl font-bold">{regenerating ? '重新生成题目中...' : 'Gemini AI 出题中...'}</h2>
          <p className="text-blue-200 text-sm">正在为你生成5道个性化练习题</p>
          <div className="flex space-x-2 justify-center mt-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-3 h-3 bg-white/60 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // =========== 提交中 ===========
  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⚙️</div>
          <p className="text-xl font-bold">正在计算得分...</p>
        </div>
      </div>
    )
  }

  // =========== 结果页 ===========
  if (result) {
    const scoreRate = Math.round((result.score / result.total) * 100)
    const statusInfo = STATUS_NEXT_MSG[result.srResult.newStatus] || { msg: '继续努力！', emoji: '💪' }
    const totalTime = elapsed

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-500 pb-24">
        {/* Result header */}
        <div className="px-5 pt-12 pb-6 text-white text-center">
          <div className="text-7xl mb-3 animate-bounce-in">
            {result.allCorrect ? '🏆' : scoreRate >= 80 ? '⭐' : scoreRate >= 60 ? '👍' : '💪'}
          </div>
          <h2 className="text-3xl font-black mb-1">
            {result.allCorrect ? '全部正确！' : `得了 ${result.score}/${result.total} 分`}
          </h2>
          <p className="text-blue-100">{result.srResult.message}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-blue-200">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>用时 {formatTime(totalTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={14} />
              <span>连胜 {comboCount} 题</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-t-3xl px-5 pt-6 min-h-[65vh]">
          {/* Score card */}
          <div className="card mb-5">
            <div className="flex items-center justify-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-4xl font-black text-blue-600">{result.score}</div>
                <div className="text-xs text-slate-400 mt-1">答对题数</div>
              </div>
              <div className="text-2xl text-slate-300">/</div>
              <div className="text-center">
                <div className="text-4xl font-black text-slate-400">{result.total}</div>
                <div className="text-xs text-slate-400 mt-1">总题数</div>
              </div>
              <div className="text-2xl text-slate-300">=</div>
              <div className="text-center">
                <div className={`text-4xl font-black ${scoreRate >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
                  {scoreRate}%
                </div>
                <div className="text-xs text-slate-400 mt-1">正确率</div>
              </div>
            </div>

            {/* Score progress bar */}
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
            <div className="flex items-center justify-center gap-2 bg-yellow-50 rounded-2xl py-3 px-4">
              <Star size={20} className="text-yellow-500" fill="currentColor" />
              <span className="font-bold text-yellow-700 text-lg">
                +{result.srResult.pointsEarned} 积分
              </span>
            </div>
          </div>

          {/* Status update card */}
          <div className={`card mb-5 border-2 ${
            result.srResult.newStatus === 'MASTERED'
              ? 'border-green-200 bg-green-50'
              : 'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{statusInfo.emoji}</div>
              <div>
                <p className="font-bold text-slate-700">{statusInfo.msg}</p>
                <p className="text-sm text-slate-500">
                  连续全对：{result.srResult.newStreak} 次
                </p>
                {result.srResult.nextReviewAt && (
                  <p className="text-xs text-purple-500 mt-0.5">
                    📅 下次复习：{new Date(result.srResult.nextReviewAt).toLocaleDateString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed results */}
          <div className="card mb-5">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Trophy size={18} className="text-orange-500" />
              答题详情
            </h3>
            <div className="space-y-2">
              {result.detailedResults.map((r, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-2xl ${
                    r.isCorrect ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className={`text-xl flex-shrink-0 ${r.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {r.isCorrect ? '✅' : '❌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-600">第 {idx + 1} 题</p>
                    {!r.isCorrect && (
                      <>
                        <p className="text-xs text-red-500 truncate">
                          你的答案：{r.userAnswer || '（未作答）'}
                        </p>
                        <p className="text-xs text-green-600 font-medium truncate">
                          正确答案：{r.correctAnswer}
                        </p>
                      </>
                    )}
                  </div>
                  <div className={`text-sm font-bold ${r.isCorrect ? 'text-green-600' : 'text-red-400'}`}>
                    {r.isCorrect ? '+1' : '✗'}
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
                setLoading(true)
                fetchPractice()
              }}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold bg-slate-200 text-slate-600 active:scale-95 transition-all min-h-[44px]"
            >
              <RotateCcw size={18} />
              再练一次
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 btn-primary min-h-[44px]"
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
      {/* 连胜动画 */}
      {showComboAnim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-bounce-in">
            <div className="text-7xl mb-2">🔥</div>
            <div className="text-4xl font-black text-white drop-shadow-lg">
              连胜 {comboCount}!
            </div>
            <div className="text-lg text-yellow-300 font-bold mt-1">太厉害了！</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-12 pb-4 text-white">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-sm opacity-80">
              {mistake?.subject} · {mistake?.knowledgePoint}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5">
            <Zap size={14} className="text-yellow-300" />
            <span className="text-sm font-bold text-yellow-200">×{comboCount}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-bold opacity-90 w-12 text-right">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1 mt-2 opacity-70">
          <Clock size={12} />
          <span className="text-xs">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Question area */}
      <div className={`bg-slate-50 rounded-t-3xl px-5 pt-6 min-h-[70vh] transition-opacity duration-250 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>

        {/* Question card */}
        <div className="card mb-5">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="bg-blue-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
                Q{currentIndex + 1}
              </div>
              {/* 重新出题按钮 */}
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-95"
                title="重新生成题目"
              >
                <RefreshCw size={13} />
                <span>重新出题</span>
              </button>
            </div>
            <p className="text-base font-medium text-slate-700 leading-relaxed flex-1">
              {currentQuestion?.question}
            </p>
            {/* 删除按钮 */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all active:scale-95"
              title="删除这道题"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in">
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">确定删除这道题？</h3>
                <p className="text-sm text-slate-500">删除后将跳到下一题，此题不计入得分</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-2xl font-bold bg-slate-100 text-slate-600 active:scale-95 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteQuestion}
                  className="flex-1 py-3 rounded-2xl font-bold bg-red-500 text-white active:scale-95 transition-all"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 重新出题确认对话框 */}
        {showRegenerateConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in">
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">🔄</div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">重新生成题目？</h3>
                <p className="text-sm text-slate-500">重新生成会覆盖当前题目，确定吗？</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegenerateConfirm(false)}
                  className="flex-1 py-3 rounded-2xl font-bold bg-slate-100 text-slate-600 active:scale-95 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleRegenerate}
                  className="flex-1 py-3 rounded-2xl font-bold bg-blue-500 text-white active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  确认重出
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Choice options */}
        {currentQuestion?.type === 'choice' && currentQuestion.options && (
          <div className="space-y-3 mb-5">
            {currentQuestion.options.map((option, idx) => {
              let optionStyle = 'bg-white border-2 border-slate-200 text-slate-700'
              let letterStyle = 'bg-slate-100 text-slate-500'

              if (showFeedback) {
                if (option === currentQuestion.answer) {
                  optionStyle = 'bg-green-500 border-2 border-green-500 text-white'
                  letterStyle = 'bg-white/20 text-white'
                } else if (option === selectedAnswer && !isCorrect) {
                  optionStyle = 'bg-red-500 border-2 border-red-500 text-white animate-shake'
                  letterStyle = 'bg-white/20 text-white'
                } else {
                  optionStyle = 'bg-slate-100 border-2 border-slate-100 text-slate-400'
                  letterStyle = 'bg-slate-200 text-slate-400'
                }
              } else if (selectedAnswer === option) {
                optionStyle = 'bg-blue-500 border-2 border-blue-500 text-white shadow-md'
                letterStyle = 'bg-white/20 text-white'
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-2xl text-left flex items-center gap-3 transition-all duration-200 active:scale-98 min-h-[56px] ${optionStyle}`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0 transition-all ${letterStyle}`}>
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="font-medium text-sm leading-snug">{option}</span>
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
              className={`w-full p-4 rounded-2xl text-lg border-2 focus:outline-none transition-all min-h-[56px] ${
                showFeedback
                  ? isCorrect
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-red-400 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white focus:border-blue-400'
              }`}
            />
          </div>
        )}

        {/* True/False options */}
        {currentQuestion?.type === 'truefalse' && (
          <div className="flex gap-3 mb-5">
            {['正确', '错误'].map((option) => {
              let optionStyle = 'bg-white border-2 border-slate-200 text-slate-700'

              if (showFeedback) {
                if (option === currentQuestion.answer) {
                  optionStyle = 'bg-green-500 border-2 border-green-500 text-white'
                } else if (option === selectedAnswer && !isCorrect) {
                  optionStyle = 'bg-red-500 border-2 border-red-500 text-white animate-shake'
                } else {
                  optionStyle = 'bg-slate-100 border-2 border-slate-100 text-slate-400'
                }
              } else if (selectedAnswer === option) {
                optionStyle = 'bg-blue-500 border-2 border-blue-500 text-white shadow-md'
              }

              return (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  disabled={showFeedback}
                  className={`flex-1 py-6 rounded-2xl font-bold text-lg transition-all duration-200 active:scale-95 min-h-[56px] ${optionStyle}`}
                >
                  {option === '正确' ? '✅ 正确' : '❌ 错误'}
                </button>
              )
            })}
          </div>
        )}

        {/* Feedback panel */}
        {showFeedback && (
          <div className={`card mb-5 border-2 animate-bounce-in ${
            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{isCorrect ? '🎉' : '💡'}</div>
              <div className="flex-1">
                <p className={`font-bold mb-1 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? '回答正确！加油冲！⭐' : '答错了，看看解析吧'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-slate-600 mb-1">
                    正确答案：
                    <span className="font-bold text-green-600">{currentQuestion?.answer}</span>
                  </p>
                )}
                {currentQuestion?.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💡</span>
                      <span className="font-bold text-blue-600 text-sm">解题思路</span>
                      <button
                        onClick={() => speakExplanation(currentQuestion.explanation || '')}
                        className="ml-auto flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-full transition-colors"
                      >
                        🔊 听解析
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
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
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all min-h-[44px] ${
              (selectedAnswer || fillAnswer)
                ? 'btn-primary'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            确认答案
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-accent w-full py-5 text-lg min-h-[44px]"
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
