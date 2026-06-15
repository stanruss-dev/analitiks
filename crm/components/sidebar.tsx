'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, TrendingUp, Users, Building2,
  CheckSquare, Activity, BarChart2, Settings, LogOut
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/deals', label: 'Сделки', icon: TrendingUp },
  { href: '/contacts', label: 'Контакты', icon: Users },
  { href: '/companies', label: 'Компании', icon: Building2 },
  { href: '/tasks', label: 'Задачи', icon: CheckSquare },
  { href: '/activities', label: 'Активность', icon: Activity },
  { href: '/analytics', label: 'Аналитика', icon: BarChart2 },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-gray-900 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="text-white font-semibold text-lg">CRM</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </aside>
  )
}
