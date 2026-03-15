'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { Camera, Upload, ChevronLeft, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'

type Step = 'select' | 'preview' | 'recognizing' | 'result' | 'saving'

interface RecognizedData {
  subject: string
  content: string
  knowledgePoint: string
  imageUrl?: string
}

const SUBJECTS = ['数学', '语文', '英语']

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('select')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [recognizedData, setRecognizedData] = useState<RecognizedData | null>(null)
  const [editableContent, setEditableContent] = useState('')
  const [editableKnowledge, setEditableKnowledge] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setStep('preview')
  }

  function handleMockUpload() {
    // 直接用mock识别（不需要真实图片）
    setPreviewUrl('/api/placeholder/400/300')
    setStep('preview')
  }

  async function handleRecognize() {
    setStep('recognizing')
    setError('')

    try {
      const formData = new FormData()
      if (selectedSubject) formData.append('subject', selectedSubject)

      // 如果有真实文件，添加进去
      const fileInput = fileInputRef.current
      if (fileInput?.files?.[0]) {
        formData.append('image', fileInput.files[0])
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setRecognizedData(data.recognized)
      setEditableContent(data.recognized.content)
      setEditableKnowledge(data.recognized.knowledgePoint)
      setSelectedSubject(data.recognized.subject)
      setStep('result')
    } catch {
      setError('识别失败，请重试')
      setStep('preview')
    }
  }

  async function handleSave() {
    setStep('saving')
    try {
      const res = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject || recognizedData?.subject,
          content: editableContent,
          knowledgePoint: editableKnowledge,
          imageUrl: recognizedData?.imageUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSaved(true)

      // 跳转到练习页
      setTimeout(() => {
        router.push(`/practice?mistakeId=${data.mistake.id}`)
      }, 1500)
    } catch {
      setError('保存失败，请重试')
      setStep('result')
    }
  }

  function handleReset() {
    setStep('select')
    setPreviewUrl(null)
    setRecognizedData(null)
    setEditableContent('')
    setEditableKnowledge('')
    setSelectedSubject('')
    setError('')
    setSaved(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white/20 active:bg-white/30">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">上传错题</h1>
        </div>
        <p className="text-blue-100 text-sm ml-11">拍照或选图，AI自动识别题目</p>
      </div>

      <div className="px-5 py-6 pb-24">

        {/* Step 1: Select */}
        {step === 'select' && (
          <div className="space-y-5">
            {/* Subject selector */}
            <div className="card">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                📚 选择科目（可选）
              </h3>
              <div className="flex gap-3">
                {SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(selectedSubject === subj ? '' : subj)}
                    className={`flex-1 py-3 rounded-2xl font-medium transition-all ${
                      selectedSubject === subj
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="card flex flex-col items-center py-8 gap-3 active:scale-95 transition-all hover:bg-blue-50 border-2 border-dashed border-blue-200"
              >
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Camera size={32} className="text-blue-500" />
                </div>
                <span className="font-bold text-slate-700">拍照上传</span>
                <span className="text-xs text-slate-400">拍摄错题</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="card flex flex-col items-center py-8 gap-3 active:scale-95 transition-all hover:bg-orange-50 border-2 border-dashed border-orange-200"
              >
                <div className="bg-orange-100 p-4 rounded-2xl">
                  <Upload size={32} className="text-orange-500" />
                </div>
                <span className="font-bold text-slate-700">选择图片</span>
                <span className="text-xs text-slate-400">从相册选取</span>
              </button>
            </div>

            {/* Mock button for demo */}
            <div className="card text-center">
              <p className="text-slate-400 text-sm mb-3">或者使用演示模式</p>
              <button
                onClick={handleMockUpload}
                className="btn-accent w-full flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                🤖 AI演示识别（无需图片）
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-5">
            {previewUrl && previewUrl !== '/api/placeholder/400/300' && (
              <div className="card overflow-hidden p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="预览" className="w-full h-64 object-cover" />
              </div>
            )}

            {previewUrl === '/api/placeholder/400/300' && (
              <div className="card flex items-center justify-center h-48 bg-gradient-to-br from-blue-50 to-orange-50">
                <div className="text-center">
                  <div className="text-5xl mb-3">📝</div>
                  <p className="text-slate-500">演示模式 - 模拟题目图片</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-2xl font-bold bg-slate-200 text-slate-600 active:scale-95 transition-all"
              >
                重新选择
              </button>
              <button
                onClick={handleRecognize}
                className="flex-2 btn-primary flex items-center justify-center gap-2"
                style={{ flex: 2 }}
              >
                <Sparkles size={20} />
                AI识别题目
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Recognizing */}
        {step === 'recognizing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="text-4xl animate-bounce">🤖</div>
              </div>
              <div className="absolute -right-2 -top-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center animate-spin">
                <Sparkles size={14} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-700 mb-2">AI识别中...</h3>
              <p className="text-slate-400 text-sm">正在分析题目内容和知识点</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-orange-500 h-full rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && recognizedData && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-600">
              <CheckCircle size={18} />
              <span className="font-medium">识别成功！请确认或修改内容</span>
            </div>

            {/* Subject */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">科目</label>
              <div className="flex gap-2">
                {SUBJECTS.map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      selectedSubject === subj || recognizedData.subject === subj
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">题目内容</label>
              <textarea
                value={editableContent}
                onChange={e => setEditableContent(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                rows={4}
              />
            </div>

            {/* Knowledge Point */}
            <div className="card">
              <label className="text-sm font-bold text-slate-500 block mb-2">知识点</label>
              <input
                value={editableKnowledge}
                onChange={e => setEditableKnowledge(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 py-4 rounded-2xl font-bold bg-slate-200 text-slate-600">
                重新上传
              </button>
              <button
                onClick={handleSave}
                className="btn-primary flex items-center gap-2 justify-center"
                style={{ flex: 2 }}
              >
                ✅ 保存并开始练习
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Saving */}
        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              {saved ? (
                <CheckCircle size={48} className="text-green-500 animate-bounce-in" />
              ) : (
                <div className="text-4xl animate-spin">⚙️</div>
              )}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                {saved ? '保存成功！' : '正在保存...'}
              </h3>
              <p className="text-slate-400 text-sm">
                {saved ? '即将跳转到练习页面 🚀' : '正在生成练习题'}
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
