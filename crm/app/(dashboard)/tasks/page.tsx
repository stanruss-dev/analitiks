'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/header'
import { formatDate } from '@/lib/utils'
import { Plus, X, CheckSquare, Square, Phone, Users, Mail, AlignLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string; title: string; description: string | null; type: string
  priority: string; status: string; dueDate: string | null
  assignedTo?: { name: string } | null
  deal?: { title: string } | null
  contact?: { firstName: string; lastName: string } | null
}

const typeIcons: Record<string, React.ReactNode> = {
  CALL: <Phone size={14} />, MEETING: <Users size={14} />,
  EMAIL: <Mail size={14} />, TASK: <AlignLeft size={14} />,
}

const typeLabels: Record<string, string> = {
  CALL: 'Звонок', MEETING: 'Встреча', EMAIL: 'Письмо', TASK: 'Задача',
}

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-400', MEDIUM: 'text-yellow-500', HIGH: 'text-red-500',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает', IN_PROGRESS: 'В работе', DONE: 'Выполнено', OVERDUE: 'Просрочено',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'TASK', priority: 'MEDIUM', dueDate: '' })

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks${filter ? `?status=${filter}` : ''}`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
  }, [filter])

  useEffect(() => { load() }, [load])

  async function createTask() {
    if (!form.title) return
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
    })
    if (res.ok) { setShowModal(false); load() }
  }

  async function complete(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'DONE' } : t))
  }

  async function del(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const filters = [
    { label: 'Все', value: '' },
    { label: 'Ожидают', value: 'PENDING' },
    { label: 'В работе', value: 'IN_PROGRESS' },
    { label: 'Выполнено', value: 'DONE' },
    { label: 'Просрочено', value: 'OVERDUE' },
  ]

  return (
    <div className="flex flex-col flex-1">
      <Header title="Задачи" />
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filter === f.value ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className="ml-auto flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Новая задача
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-2">
        {tasks.length === 0 && (
          <div className="text-center text-gray-400 py-12">Задач не найдено</div>
        )}
        {tasks.map(t => (
          <div key={t.id} className={cn(
            'bg-white rounded-xl p-4 shadow-sm border flex items-start gap-4',
            t.status === 'DONE' ? 'border-gray-100 opacity-60' : 'border-gray-200'
          )}>
            <button onClick={() => t.status !== 'DONE' && complete(t.id)} className="mt-0.5 flex-shrink-0">
              {t.status === 'DONE' ? <CheckSquare size={18} className="text-green-500" /> : <Square size={18} className="text-gray-300 hover:text-indigo-500" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('font-medium text-sm', t.status === 'DONE' && 'line-through text-gray-400')}>
                  {t.title}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                  {typeIcons[t.type]} {typeLabels[t.type]}
                </span>
                <span className={cn('text-xs font-medium', priorityColors[t.priority])}>
                  {priorityLabels[t.priority]}
                </span>
              </div>
              {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {t.dueDate && <span>До {formatDate(t.dueDate)}</span>}
                {t.assignedTo && <span>👤 {t.assignedTo.name}</span>}
                {t.deal && <span>💼 {t.deal.title}</span>}
                {t.contact && <span>👤 {t.contact.firstName} {t.contact.lastName}</span>}
                <span className={cn('ml-auto px-2 py-0.5 rounded-full text-xs',
                  t.status === 'DONE' ? 'bg-green-50 text-green-600' :
                  t.status === 'OVERDUE' ? 'bg-red-50 text-red-600' :
                  t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                )}>
                  {statusLabels[t.status]}
                </span>
              </div>
            </div>
            <button onClick={() => del(t.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Новая задача</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Название *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Позвонить клиенту" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Описание</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  placeholder="Подробности задачи..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Тип</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="TASK">Задача</option>
                    <option value="CALL">Звонок</option>
                    <option value="MEETING">Встреча</option>
                    <option value="EMAIL">Письмо</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Приоритет</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="LOW">Низкий</option>
                    <option value="MEDIUM">Средний</option>
                    <option value="HIGH">Высокий</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Срок</label>
                <input type="datetime-local" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Отмена</button>
                <button onClick={createTask}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">Создать</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
