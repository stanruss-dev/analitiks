'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Header } from '@/components/header'
import Link from 'next/link'
import { Users } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user.name || '')
  const [saved, setSaved] = useState(false)

  async function saveProfile() {
    await fetch(`/api/users/${session?.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    await update({ name })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Настройки" />
      <div className="flex-1 p-6 max-w-2xl space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Профиль</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={session?.user.email || ''}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
              />
            </div>
            <button
              onClick={saveProfile}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
            >
              {saved ? '✓ Сохранено' : 'Сохранить'}
            </button>
          </div>
        </div>

        {session?.user.role === 'ADMIN' && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Администрирование</h2>
            <Link
              href="/settings/users"
              className="flex items-center gap-3 text-sm text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <Users size={18} />
              Управление пользователями
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}