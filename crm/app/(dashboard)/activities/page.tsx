'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/header'
import { formatDateTime } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

interface Activity {
  id: string; type: string; content: string; createdAt: string
  user: { name: string }
  deal?: { title: string } | null
  contact?: { firstName: string; lastName: string } | null
}

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  NOTE: { label: 'Заметка', icon: '📝', color: 'bg-blue-50 text-blue-600' },
  CALL_LOG: { label: 'Звонок', icon: '📞', color: 'bg-green-50 text-green-600' },
  STATUS_CHANGE: { label: 'Смена статуса', icon: '🔄', color: 'bg-purple-50 text-purple-600' },
  DEAL_CREATED: { label: 'Новая сделка', icon: '💼', color: 'bg-indigo-50 text-indigo-600' },
  CONTACT_CREATED: { label: 'Новый контакт', icon: '👤', color: 'bg-cyan-50 text-cyan-600' },
  TASK_CREATED: { label: 'Новая задача', icon: '✅', color: 'bg-yellow-50 text-yellow-600' },
  TASK_COMPLETED: { label: 'Задача выполнена', icon: '✔️', color: 'bg-green-50 text-green-700' },
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [showModal, setShowModal] = useState(false)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/activities')
    const data = await res.json()
    setActivities(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { load() }, [load])

  async function addNote() {
    if (!note.trim()) return
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'NOTE', content: note }),
    })
    setNote('')
    setShowModal(false)
    load()
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Лента активностей" />
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <span className="text-sm text-gray-500 dark:text-gray-400">{activities.length} событий</span>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Добавить заметку
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto">
          {activities.length === 0 && (
            <div className="text-center text-gray-400 py-12">Активностей не найдено</div>
          )}
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-4">
              {activities.map(act => {
                const meta = typeLabels[act.type] || { label: act.type, icon: '•', color: 'bg-gray-50 text-gray-600 dark:text-gray-400' }
                return (
                  <div key={act.id} className="flex gap-4 relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg flex-shrink-0 z-10 ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(act.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800">{act.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>👤 {act.user.name}</span>
                        {act.deal && <span>💼 {act.deal.title}</span>}
                        {act.contact && <span>👤 {act.contact.firstName} {act.contact.lastName}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl dark:shadow-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Добавить заметку</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
              placeholder="Текст заметки..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Отмена</button>
              <button onClick={addNote}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}