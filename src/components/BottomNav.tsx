'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Upload, BookOpen, BarChart3, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/upload', icon: Upload, label: '上传' },
  { href: '/mistakes', icon: BookOpen, label: '错题库' },
  { href: '/report', icon: BarChart3, label: '报告' },
  { href: '/settings', icon: Settings, label: '设置' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 shadow-2xl z-50">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-200 min-w-[44px] ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-200 ${
                isActive ? 'bg-blue-50' : ''
              }`}>
                <Icon
                  size={22}
                  className={`transition-all duration-200 ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-xs font-medium mt-0.5 ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* iOS safe area padding */}
      <div className="pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
