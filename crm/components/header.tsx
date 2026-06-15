'use client'

import { useSession } from 'next-auth/react'

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  USER: 'Пользователь',
}

export function Header({ title }: { title: string }) {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {session?.user && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{session.user.name}</div>
            <div className="text-xs text-gray-500">{roleLabels[session.user.role] || session.user.role}</div>
          </div>
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-semibold text-sm">
              {session.user.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </header>
  )
}
