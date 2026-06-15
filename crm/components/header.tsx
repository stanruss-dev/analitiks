'use client'

import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/theme-toggle'

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  USER: 'Пользователь',
}

export function Header({ title }: { title: string }) {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[session.user.role] || session.user.role}</div>
            </div>
            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                {session.user.name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
