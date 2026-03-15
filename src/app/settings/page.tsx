'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { ChevronLeft, Save, CheckCircle } from 'lucide-react'

interface User {
  id: string
  name: string
  grade: string
  avatar: string
  totalPoints: number
  streak: number
}

const GRADE_OPTIONS = [
  '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
  '初一', '初二', '初三',
  '高一', '高二', '高三',
]

const AVATAR_OPTIONS = [
  '🧑‍🎓', '👦', '👧', '🧒', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸',
  '🚀', '⭐', '🌈', '🎯', '💡', '🔥', '💪', '🏆', '🎮', '📚',
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/user')
      const data = await res.json()
      setUser(data.user)
      setName(data.user.name || '')
      setGrade(data.user.grade || '')
      setAvatar(data.user.avatar || '🧑‍🎓')
    } catch (err) {
      console.error('Failed to fetch user:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), grade, avatar }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('Failed to save user:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">⚙️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white/20 active:bg-white/30">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">个人设置</h1>
        </div>
        <p className="text-slate-300 text-sm ml-11">管理你的学习档案</p>
      </div>

      <div className="px-5 py-6 pb-24 space-y-5">
        {/* Avatar Picker */}
        <div className="card">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-5xl">
              {avatar}
            </div>
          </div>
          <h3 className="font-bold text-slate-700 mb-3 text-center">选择头像</h3>
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className={`text-2xl py-2 rounded-2xl transition-all active:scale-90 ${
                  avatar === emoji
                    ? 'bg-blue-100 ring-2 ring-blue-400 scale-110'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="card">
          <label className="text-sm font-bold text-slate-500 block mb-2">昵称</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入你的昵称"
            maxLength={20}
            className="w-full p-3 bg-slate-50 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium"
          />
        </div>

        {/* Grade */}
        <div className="card">
          <label className="text-sm font-bold text-slate-500 block mb-3">年级</label>
          <div className="grid grid-cols-3 gap-2">
            {GRADE_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                  grade === g
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Display */}
        {user && (
          <div className="card">
            <h3 className="font-bold text-slate-700 mb-3">我的数据</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-2xl p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{user.totalPoints}</div>
                <div className="text-xs text-slate-500">总积分</div>
              </div>
              <div className="bg-orange-50 rounded-2xl p-3 text-center">
                <div className="text-2xl font-bold text-orange-500">{user.streak}</div>
                <div className="text-xs text-slate-500">连续学习天数</div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
            saved
              ? 'bg-green-500 text-white'
              : saving || !name.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-500 text-white shadow-lg'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle size={22} />
              保存成功！
            </>
          ) : saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save size={22} />
              保存设置
            </>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
