'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { formatCurrency, formatDate, formatDateTime, parseJson } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Phone, Mail, Building2, User, Calendar,
  CheckSquare, Square, Tag, Pencil, Check, X
} from 'lucide-react'

interface Deal {
  id: string; title: string; amount: number; status: string; createdAt: string; updatedAt: string; closedAt: string | null; tags: string; lostReason: string | null
  stage: { id: string; name: string; color: string }
  contact: { id: string; firstName: string; lastName: string; phones: string; emails: string; position: string | null } | null
  company: { id: string; name: string } | null
  assignedTo: { id: string; name: string; email: string } | null
  tasks: {
    id: string; title: string; type: string; priority: string; status: string; dueDate: string | null
    assignedTo: { name: string } | null
  }[]
  activities: {
    id: string; type: string; content: string; createdAt: string
    user: { name: string }
  }[]
}

const LOST_REASONS = [
  'Высокая цена',
  'Выбрали конкурента',
  'Нет бюджета',
  'Не устроили условия',
  'Отложили решение',
  'Не вышли на связь',
  'Передумали',
  'Другое',
]

const statusMap: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Открыта', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  WON:  { label: 'Выиграна', cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  LOST: { label: 'Проиграна', cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

const taskTypeLabels: Record<string, string> = {
  CALL: '📞 Звонок', MEETING: '👥 Встреча', EMAIL: '✉️ Письмо', TASK: '✅ Задача',
}

const priorityColors: Record<string, string> = {
  LOW: 'text-gray-400', MEDIUM: 'text-yellow-500', HIGH: 'text-red-500',
}

const activityIcons: Record<string, string> = {
  NOTE: '📝', CALL_LOG: '📞', STATUS_CHANGE: '🔄',
  DEAL_CREATED: '💼', CONTACT_CREATED: '👤', TASK_CREATED: '✅', TASK_COMPLETED: '✔️',
}

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [editTitle, setEditTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editAmount, setEditAmount] = useState(false)
  const [amountDraft, setAmountDraft] = useState('')
  const [noteText, setNoteText] = useState('')
  const [lostModal, setLostModal] = useState(false)
  const [lostReasons, setLostReasons] = useState<string[]>([])

  const load = useCallback(async () => {
    const res = await fetch(`/api/deals/${id}`)
    if (!res.ok) { router.push('/deals'); return }
    const data = await res.json()
    setDeal(data)
    setTitleDraft(data.title)
    setAmountDraft(String(data.amount))
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) load()
  }

  async function saveTitle() {
    await patch({ title: titleDraft })
    setEditTitle(false)
  }

  async function saveAmount() {
    await patch({ amount: parseFloat(amountDraft) || 0 })
    setEditAmount(false)
  }

  async function addNote() {
    if (!noteText.trim()) return
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'NOTE', content: noteText, dealId: id }),
    })
    setNoteText('')
    load()
  }

  async function completeTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    })
    load()
  }

  if (loading) return (
    <div className="flex flex-col flex-1">
      <Header title="Сделка" />
      <div className="flex-1 flex items-center justify-center text-gray-400">Загрузка...</div>
    </div>
  )

  if (!deal) return null

  const tags = parseJson<string[]>(deal.tags, [])
  const phones = deal.contact ? parseJson<string[]>(deal.contact.phones, []) : []
  const emails = deal.contact ? parseJson<string[]>(deal.contact.emails, []) : []
  const st = statusMap[deal.status] || statusMap.OPEN

  return (
    <div className="flex flex-col flex-1">
      <Header title="Сделка" />

      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
        {/* Шапка */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <Link href="/deals" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-3 w-fit">
            <ArrowLeft size={15} /> Назад к воронке
          </Link>

          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              {editTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveTitle()}
                    className="text-2xl font-bold border-b-2 border-indigo-500 outline-none bg-transparent flex-1 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                  <button onClick={saveTitle} className="text-green-500 hover:text-green-600"><Check size={18} /></button>
                  <button onClick={() => setEditTitle(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{deal.title}</h1>
                  <button onClick={() => setEditTitle(true)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 transition-opacity">
                    <Pencil size={15} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deal.stage.color }} />
                  {deal.stage.name}
                </span>
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    <Tag size={10} />{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right">
              {editAmount ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={amountDraft}
                    onChange={e => setAmountDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveAmount()}
                    className="text-2xl font-bold border-b-2 border-indigo-500 outline-none bg-transparent w-40 text-right text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                  <button onClick={saveAmount} className="text-green-500"><Check size={18} /></button>
                  <button onClick={() => setEditAmount(false)} className="text-gray-400"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group justify-end">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(deal.amount)}</span>
                  <button onClick={() => setEditAmount(true)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500 transition-opacity">
                    <Pencil size={15} />
                  </button>
                </div>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Создана {formatDate(deal.createdAt)}</div>
            </div>
          </div>

          {deal.status === 'OPEN' && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => patch({ status: 'WON' })}
                className="bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-600">Выиграна</button>
              <button onClick={() => { setLostReasons([]); setLostModal(true) }}
                className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-1.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50">Проиграна</button>
            </div>
          )}
          {deal.status === 'LOST' && deal.lostReason && (
            <div className="mt-2 text-sm text-red-400 italic">Причина: «{deal.lostReason}»</div>
          )}
          {deal.status !== 'OPEN' && (
            <button onClick={() => patch({ status: 'OPEN', lostReason: null })}
              className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600">↩ Вернуть в работу</button>
          )}

          {lostModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Причина отказа</h2>
                  <button onClick={() => setLostModal(false)}><X size={20} /></button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Можно выбрать несколько</p>
                <div className="space-y-2">
                  {LOST_REASONS.map(reason => (
                    <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={lostReasons.includes(reason)}
                        onChange={() => setLostReasons(prev =>
                          prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
                        )}
                        className="w-4 h-4 accent-red-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                        {reason}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setLostModal(false)}
                    className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Отмена</button>
                  <button
                    onClick={() => { patch({ status: 'LOST', lostReason: lostReasons.join(', ') }); setLostModal(false) }}
                    disabled={lostReasons.length === 0}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-40">Закрыть сделку</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Основной контент */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Левая колонка — детали */}
          <div className="lg:col-span-1 space-y-4">

            {/* Контакт */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Контакт</h3>
              {deal.contact ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </span>
                  </div>
                  {deal.contact.position && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 pl-5">{deal.contact.position}</div>
                  )}
                  {phones.map(p => (
                    <a key={p} href={`tel:${p}`} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline pl-1">
                      <Phone size={13} />{p}
                    </a>
                  ))}
                  {emails.map(e => (
                    <a key={e} href={`mailto:${e}`} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline pl-1">
                      <Mail size={13} />{e}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Контакт не привязан</p>
              )}
            </div>

            {/* Компания */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Компания</h3>
              {deal.company ? (
                <div className="flex items-center gap-2">
                  <Building2 size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">{deal.company.name}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Компания не привязана</p>
              )}
            </div>

            {/* Ответственный */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Ответственный</h3>
              {deal.assignedTo ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                    {deal.assignedTo.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{deal.assignedTo.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{deal.assignedTo.email}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Не назначен</p>
              )}
            </div>

            {/* Даты */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Даты</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Создана</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatDate(deal.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Изменена</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatDate(deal.updatedAt)}</span>
                </div>
                {deal.closedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Закрыта</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(deal.closedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правая колонка — задачи и активности */}
          <div className="lg:col-span-2 space-y-6">

            {/* Задачи */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" /> Задачи
              </h3>
              {deal.tasks.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Задач нет</p>
              ) : (
                <div className="space-y-2">
                  {deal.tasks.map(t => (
                    <div key={t.id} className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border',
                      t.status === 'DONE'
                        ? 'border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60'
                        : 'border-gray-100 dark:border-gray-700'
                    )}>
                      <button onClick={() => t.status !== 'DONE' && completeTask(t.id)} className="mt-0.5 flex-shrink-0">
                        {t.status === 'DONE'
                          ? <CheckSquare size={16} className="text-green-500" />
                          : <Square size={16} className="text-gray-300 hover:text-indigo-500" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-medium text-gray-900 dark:text-gray-100', t.status === 'DONE' && 'line-through text-gray-400 dark:text-gray-600')}>
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          <span>{taskTypeLabels[t.type]}</span>
                          {t.dueDate && <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(t.dueDate)}</span>}
                          {t.assignedTo && <span>· {t.assignedTo.name}</span>}
                          <span className={cn('font-medium', priorityColors[t.priority])}>
                            {t.priority === 'HIGH' ? '↑ Высокий' : t.priority === 'LOW' ? '↓ Низкий' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Добавить заметку */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Добавить заметку</h3>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Напишите заметку по сделке..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={addNote}
                disabled={!noteText.trim()}
                className="mt-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-40"
              >
                Сохранить
              </button>
            </div>

            {/* Лента активностей */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">История</h3>
              {deal.activities.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Активностей нет</p>
              ) : (
                <div className="space-y-3">
                  {deal.activities.map(act => (
                    <div key={act.id} className="flex gap-3">
                      <span className="text-lg flex-shrink-0">{activityIcons[act.type] || '•'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200">{act.content}</p>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {act.user.name} · {formatDateTime(act.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
