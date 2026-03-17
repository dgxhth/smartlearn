'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import {
  Camera, Upload, ChevronLeft, Sparkles, CheckCircle, AlertCircle,
  Info, PenLine
} from 'lucide-react'

type Step = 'select' | 'preview' | 'recognizing' | 'result' | 'saving' | 'manual'

interface RecognizedData {
  subject: string
  content: string
  knowledgePoint: string
  imageUrl?: string
  confidence?: number
}

const SUBJECTS = ['数学', '语文', '英语']
const SUBJECT_EMOJIS: Record<string, string> = { '数学': '🔢', '语文': '📖', '英语': '🌍' }

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('select')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [recognizedData, setRecognizedData] = useState<RecognizedData | null>(null)
  const [editableContent, setEditableContent] = useState('')
  const [editableKnowledge, setEditableKnowledge] = useState('')
  const [editableSubject, setEditableSubject] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [recognizeProgress, setRecognizeProgress] = useState(0)
  const [manualSubject, setManualSubject] = useState('')
  const [manualKnowledge, setManualKnowledge] = useState('')
  const [manualContent, setManualContent] = useState('')

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setStep('preview')
    setError('')
  }

  function handleDemoMode() {
    setSelectedFile(null)
    setPreviewUrl('demo')
    setStep('preview')
    setError('')
  }

  async function handleRecognize() {
    setStep('recognizing')
    setError('')
    setRecognizeProgress(0)

    // 模拟进度动画
    const progressTimer = setInterval(() => {
      setRecognizeProgress(prev => {
        if (prev >= 90) { clearInterval(progressTimer); return 90 }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      const formData = new FormData()
      if (selectedSubject) formData.append('subject', selectedSubject)

      if (selectedFile) {
        formData.append('image', selectedFile)
      } else {
        // demo 模式
        formData.append('useMock', 'true')
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressTimer)
      setRecognizeProgress(100)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await new Promise(r => setTimeout(r, 500)) // 短暂停留显示100%

      setRecognizedData(data.recognized)
      setEditableContent(data.recognized.content)
      setEditableKnowledge(data.recognized.knowledgePoint)
      setEditableSubject(data.recognized.subject)
      setStep('result')
    } catch (err) {
      clearInterval(progressTimer)
      console.error('Recognition error:', err)
      setError('识别失败，请检查网络后重试')
      setStep('preview')
    }
  }

  async function handleSave() {
    if (!editableContent.trim() || !editableKnowledge.trim()) {
      setError('题目内容和知识点不能为空')
      return
    }
    setStep('saving')
    setSaved(false)

    try {
      const res = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editableSubject || selectedSubject || recognizedData?.subject || '数学',
          content: editableContent.trim(),
          knowledgePoint: editableKnowledge.trim(),
          imageUrl: recognizedData?.imageUrl || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSaved(true)

      setTimeout(() => {
        router.push(`/practice?mistakeId=${data.mistake.id}`)
      }, 1200)
    } catch (err) {
      console.error('Save error:', err)
      setError('保存失败，请重试')
      setStep('result')
    }
  }

  function handleReset() {
    setStep('select')
    setPreviewUrl(null)
    setSelectedFile(null)
    setRecognizedData(null)
    setEditableContent('')
    setEditableKnowledge('')
    setEditableSubject('')
    setSelectedSubject('')
    setError('')
    setSaved(false)
    setRecognizeProgress(0)
    setManualSubject('')
    setManualKnowledge('')
    setManualContent('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleManualSave() {
    if (!manualKnowledge.trim()) {
      setError('知识点不能为空')
      return
    }
    if (!manualSubject) {
      setError('请选择科目')
      return
    }
    setStep('saving')
    setSaved(false)
    setError('')

    try {
      // 把多行/逗号分隔的知识点合并为"、"连接的字符串
      const knowledgePoints = manualKnowledge
        .split(/[\n,，]/)
        .map(k => k.trim())
        .filter(k => k.length > 0)
      const combinedKnowledge = knowledgePoints.join('、')

      const content = manualContent.trim() || `练习：${combinedKnowledge}`
      const res = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: manualSubject,
          content,
          knowledgePoint: combinedKnowledge,
          imageUrl: null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSaved(true)

      setTimeout(() => {
        router.push(`/practice?mistakeId=${data.mistake.id}`)
      }, 1200)
    } catch (err) {
      console.error('Manual save error:', err)
      setError('保存失败，请重试')
      setStep('manual')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => step === 'select' ? router.back() : handleReset()}
            className="p-2 rounded-full bg-white/20 active:bg-white/30 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">上传错题</h1>
        </div>
        <p className="text-blue-100 text-sm ml-11">
          {step === 'select' && '拍照或选图，AI自动识别题目'}
          {step === 'manual' && '输入知识点，AI自动生成练习题'}
          {step === 'preview' && '确认图片，点击开始识别'}
          {step === 'recognizing' && 'AI正在分析题目...'}
          {step === 'result' && '识别完成，请确认内容'}
          {step === 'saving' && '正在保存...'}
        </p>
        {/* Step indicator */}
        <div className="flex gap-2 mt-3 ml-11">
          {['select', 'preview', 'result', 'saving'].map((s, idx) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                ['select', 'preview', 'recognizing', 'result', 'saving'].indexOf(step) >= idx
                  ? 'bg-white flex-1'
                  : 'bg-white/30 w-6'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-5 py-6 pb-24">

        {/* ======= Step 1: Select ======= */}
        {step === 'select' && (
          <div className="space-y-5">
            {/* Subject selector */}
            <div className="card">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                📚 选择科目
                <span className="text-xs text-slate-400 font-normal">（可选，AI也能自动识别）</span>
              </h3>
              <div className="flex gap-3">
                {SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(selectedSubject === subj ? '' : subj)}
                    className={`flex-1 py-3 rounded-2xl font-medium transition-all active:scale-95 ${
                      selectedSubject === subj
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {SUBJECT_EMOJIS[subj]} {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*'
                    fileInputRef.current.capture = 'environment'
                    fileInputRef.current.click()
                  }
                }}
                className="card flex flex-col items-center py-8 gap-3 active:scale-95 transition-all hover:bg-blue-50 border-2 border-dashed border-blue-200 min-h-[44px]"
              >
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Camera size={32} className="text-blue-500" />
                </div>
                <span className="font-bold text-slate-700">拍照上传</span>
                <span className="text-xs text-slate-400">拍摄错题图片</span>
              </button>

              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture')
                    fileInputRef.current.click()
                  }
                }}
                className="card flex flex-col items-center py-8 gap-3 active:scale-95 transition-all hover:bg-orange-50 border-2 border-dashed border-orange-200 min-h-[44px]"
              >
                <div className="bg-orange-100 p-4 rounded-2xl">
                  <Upload size={32} className="text-orange-500" />
                </div>
                <span className="font-bold text-slate-700">选择图片</span>
                <span className="text-xs text-slate-400">从相册选取</span>
              </button>
            </div>

            {/* AI tip */}
            <div className="flex items-start gap-2 bg-blue-50 rounded-2xl p-4">
              <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-600">
                支持手写体和印刷体。AI会自动识别题目内容、科目和知识点。
              </p>
            </div>

            {/* Demo mode */}
            <div className="card text-center">
              <p className="text-slate-400 text-sm mb-3">没有题目图片？</p>
              <div className="space-y-3">
                <button
                  onClick={() => { setStep('manual'); setError('') }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <PenLine size={20} />
                  ✍️ 手动输入知识点
                </button>
                <button
                  onClick={handleDemoMode}
                  className="w-full py-3 rounded-2xl font-medium bg-slate-100 text-slate-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  🤖 AI演示模式
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* ======= Step: Manual Input ======= */}
        {step === 'manual' && (
          <div className="space-y-5">
            {/* Subject selector */}
            <div className="card">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                📚 选择科目 <span className="text-red-500 text-sm">*</span>
              </h3>
              <div className="flex gap-3">
                {SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setManualSubject(manualSubject === subj ? '' : subj)}
                    className={`flex-1 py-3 rounded-2xl font-medium transition-all active:scale-95 ${
                      manualSubject === subj
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {SUBJECT_EMOJIS[subj]} {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge point input */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">
                🎯 知识点 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={manualKnowledge}
                onChange={e => setManualKnowledge(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-xl text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-base leading-relaxed"
                rows={4}
                placeholder={`每行输入一个知识点，例如：\n一元一次方程\n二元一次方程组\n不等式`}
              />
              <p className="text-xs text-slate-400 mt-2">每行一个知识点，或用逗号/顿号分隔。有多个知识点时AI会均匀出题，3个以上知识点自动增加到7道题</p>
            </div>

            {/* Optional: specific question content */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">
                📝 题目内容 <span className="text-slate-400 font-normal">（选填）</span>
              </label>
              <textarea
                value={manualContent}
                onChange={e => setManualContent(e.target.value)}
                className="w-full p-4 bg-slate-50 rounded-xl text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm leading-relaxed"
                rows={4}
                placeholder="可以输入具体的错题内容，AI会根据这道题生成类似的练习题&#10;&#10;不填的话，AI会根据知识点自动出题"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 py-4 rounded-2xl font-bold bg-slate-200 text-slate-600 active:scale-95 min-h-[44px]">
                返回
              </button>
              <button
                onClick={handleManualSave}
                className="btn-primary flex items-center gap-2 justify-center min-h-[44px]"
                style={{ flex: 2 }}
              >
                <Sparkles size={20} />
                生成练习题
              </button>
            </div>
          </div>
        )}

        {/* ======= Step 2: Preview ======= */}
        {step === 'preview' && (
          <div className="space-y-5">
            {/* Image preview */}
            {previewUrl && previewUrl !== 'demo' ? (
              <div className="card overflow-hidden p-0 rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="题目预览"
                  className="w-full max-h-72 object-contain bg-slate-50"
                />
              </div>
            ) : (
              <div className="card flex items-center justify-center h-48 bg-gradient-to-br from-blue-50 to-orange-50">
                <div className="text-center">
                  <div className="text-5xl mb-3">🤖</div>
                  <p className="text-slate-600 font-medium">AI演示模式</p>
                  <p className="text-xs text-slate-400 mt-1">将自动生成示例识别结果</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl font-bold bg-slate-200 text-slate-600 active:scale-95 transition-all min-h-[44px]"
              >
                重新选择
              </button>
              <button
                onClick={handleRecognize}
                className="btn-primary flex items-center justify-center gap-2 min-h-[44px]"
                style={{ flex: 2 }}
              >
                <Sparkles size={20} />
                AI识别题目
              </button>
            </div>
          </div>
        )}

        {/* ======= Step 3: Recognizing ======= */}
        {step === 'recognizing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-28 h-28 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="text-5xl">🤖</div>
              </div>
              <div className="absolute -right-2 -top-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center animate-spin">
                <Sparkles size={14} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-700 mb-2">Gemini AI 识别中...</h3>
              <p className="text-slate-400 text-sm">正在分析题目内容、科目和知识点</p>
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">识别进度</span>
                <span className="text-blue-600 font-bold">{Math.round(recognizeProgress)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-orange-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${recognizeProgress}%` }}
                />
              </div>
            </div>
            <div className="space-y-2 w-full text-sm text-slate-400">
              {recognizeProgress > 20 && <p className="flex items-center gap-2"><span className="text-green-500">✓</span> 图像预处理完成</p>}
              {recognizeProgress > 50 && <p className="flex items-center gap-2"><span className="text-green-500">✓</span> 文字识别完成</p>}
              {recognizeProgress > 80 && <p className="flex items-center gap-2"><span className="text-green-500">✓</span> 知识点分析完成</p>}
            </div>
          </div>
        )}

        {/* ======= Step 4: Result ======= */}
        {step === 'result' && recognizedData && (
          <div className="space-y-5">
            {/* Confidence badge */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-600">
              <CheckCircle size={18} />
              <div>
                <span className="font-medium">识别成功！</span>
                {recognizedData.confidence && (
                  <span className="text-sm text-green-500 ml-2">
                    置信度 {Math.round(recognizedData.confidence * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Subject selector */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">📚 科目</label>
              <div className="flex gap-2">
                {SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setEditableSubject(subj)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all active:scale-95 ${
                      editableSubject === subj
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {SUBJECT_EMOJIS[subj]} {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Content editor */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">📝 题目内容</label>
              <textarea
                value={editableContent}
                onChange={e => setEditableContent(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm leading-relaxed"
                rows={5}
                placeholder="题目内容..."
              />
              <p className="text-xs text-slate-400 mt-1">可以直接编辑修正AI识别的内容</p>
            </div>

            {/* Knowledge point editor */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">🎯 知识点</label>
              <input
                value={editableKnowledge}
                onChange={e => setEditableKnowledge(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="例如：一元一次方程"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600">
                <AlertCircle size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 py-4 rounded-2xl font-bold bg-slate-200 text-slate-600 active:scale-95 min-h-[44px]">
                重新上传
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2 justify-center min-h-[44px]"
                style={{ flex: 2 }}
              >
                ✅ 保存并开始练习
              </button>
            </div>
          </div>
        )}

        {/* ======= Step 5: Saving ======= */}
        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center animate-bounce-in">
              {saved ? (
                <CheckCircle size={52} className="text-green-500" />
              ) : (
                <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                {saved ? '🎉 保存成功！' : '正在保存并生成题目...'}
              </h3>
              <p className="text-slate-400 text-sm">
                {saved ? '即将跳转到练习页面 🚀' : 'Gemini AI 正在生成5道练习题'}
              </p>
            </div>
            {!saved && (
              <div className="flex space-x-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
