'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Header } from '@/components/header'
import { formatCurrency } from '@/lib/utils'
import { Plus, X } from 'lucide-react'
import Link from 'next/link'

interface Stage { id: string; name: string; color: string; order: number }
interface Deal {
  id: string; title: string; amount: number; stageId: string; status: string
  contact?: { firstName: string; lastName: string } | null
  assignedTo?: { name: string } | null
  tags: string
  lostReason?: string | null
}

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}

const PRESET_TAGS = [
  'VIP', 'Срочно', 'Холодный', 'Тёплый', 'Горячий',
  'Крупный', 'Постоянный клиент', 'Новый клиент',
  'Партнёр', 'Тендер', 'Рассрочка', 'Повторная покупка',
]

const TAG_COLORS = [
  'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700',
  'bg-blue-100 text-blue-700', 'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700',
]
const tagColor = (tag: string) => TAG_COLORS[Math.abs([...tag].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)) % TAG_COLORS.length]

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

const statusBadge: Record<string, { label: string; cls: string }> = {
  WON:  { label: 'Выиграна', cls: 'bg-green-100 text-green-700' },
  LOST: { label: 'Проиграна', cls: 'bg-red-100 text-red-600' },
  OPEN: { label: '',          cls: '' },
}

export default function DealsPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newDeal, setNewDeal] = useState({ title: '', amount: '', stageId: '' })
  const [lostModal, setLostModal] = useState<{ dealId: string; reasons: string[] } | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newDealTagsChecked, setNewDealTagsChecked] = useState<string[]>([])
  const [newDealTagsCustom, setNewDealTagsCustom] = useState('')

  const load = useCallback(async () => {
    const [pRes, dRes] = await Promise.all([
      fetch('/api/pipelines').then(r => r.json()),
      fetch('/api/deals').then(r => r.json()),
    ])
    if (pRes[0]?.stages) setStages(pRes[0].stages)
    setDeals(Array.isArray(dRes) ? dRes : [])
    if (pRes[0]?.stages?.[0] && !newDeal.stageId) {
      setNewDeal(p => ({ ...p, stageId: pRes[0].stages[0].id }))
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const dealId = result.draggableId
    const newStageId = result.destination.droppableId
    const destStage = stages.find(s => s.id === newStageId)
    const isWon = destStage?.name === 'Выполнено'

    setDeals(prev => prev.map(d =>
      d.id === dealId
        ? { ...d, stageId: newStageId, ...(isWon ? { status: 'WON' } : {}) }
        : d
    ))

    await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageId: newStageId,
        ...(isWon ? { status: 'WON', closedAt: new Date().toISOString() } : {}),
      }),
    })
  }

  async function createDeal() {
    if (!newDeal.title || !newDeal.stageId) return
    const customTags = newDealTagsCustom.split(',').map(t => t.trim()).filter(Boolean)
    const tags = Array.from(new Set([...newDealTagsChecked, ...customTags]))
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newDeal, amount: parseFloat(newDeal.amount) || 0, tags }),
    })
    if (res.ok) {
      const deal = await res.json()
      setDeals(prev => [...prev, deal])
      setNewDeal({ title: '', amount: '', stageId: stages[0]?.id || '' })
      setNewDealTagsChecked([])
      setNewDealTagsCustom('')
      setShowModal(false)
    }
  }

  async function setStatus(id: string, status: 'WON' | 'LOST' | 'OPEN', lostReason?: string) {
    const wonStage   = status === 'WON'  ? stages.find(s => s.name === 'Выполнено') : null
    const lostStage  = status === 'LOST' ? stages.find(s => s.name === 'Проиграна') : null
    const firstStage = status === 'OPEN' ? stages.find(s => s.name !== 'Выполнено' && s.name !== 'Проиграна') : null

    await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        ...(wonStage   ? { stageId: wonStage.id,   closedAt: new Date().toISOString() } : {}),
        ...(lostStage  ? { stageId: lostStage.id,  closedAt: new Date().toISOString() } : {}),
        ...(firstStage ? { stageId: firstStage.id, closedAt: null } : {}),
        ...(status === 'LOST' && lostReason !== undefined ? { lostReason } : {}),
        ...(status === 'OPEN' ? { lostReason: null } : {}),
      }),
    })
    setDeals(prev => prev.map(d =>
      d.id === id
        ? {
            ...d,
            status,
            ...(wonStage   ? { stageId: wonStage.id }   : {}),
            ...(lostStage  ? { stageId: lostStage.id }  : {}),
            ...(firstStage ? { stageId: firstStage.id } : {}),
            ...(lostReason !== undefined ? { lostReason } : {}),
          }
        : d
    ))
  }

  async function confirmLost() {
    if (!lostModal) return
    await setStatus(lostModal.dealId, 'LOST', lostModal.reasons.join(', '))
    setLostModal(null)
  }

  function toggleLostReason(reason: string) {
    setLostModal(p => {
      if (!p) return p
      const has = p.reasons.includes(reason)
      return { ...p, reasons: has ? p.reasons.filter(r => r !== reason) : [...p.reasons, reason] }
    })
  }

  async function deleteDeal(id: string) {
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const allTags = Array.from(new Set(deals.flatMap(d => parseTags(d.tags)))).sort()
  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const visibleDeals = selectedTags.length === 0 ? deals : deals.filter(d => selectedTags.every(t => parseTags(d.tags).includes(t)))
  const stageDeals = (stageId: string) => visibleDeals.filter(d => d.stageId === stageId)
  const openCount = deals.filter(d => d.status === 'OPEN').length
  const wonCount  = deals.filter(d => d.status === 'WON').length
  const lostCount = deals.filter(d => d.status === 'LOST').length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Воронка сделок" />
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Открытых: <b className="text-gray-900 dark:text-gray-100">{openCount}</b></span>
          <span className="text-gray-500 dark:text-gray-400">Выиграно: <b className="text-green-600">{wonCount}</b></span>
          <span className="text-gray-500 dark:text-gray-400">Проиграно: <b className="text-red-500">{lostCount}</b></span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Новая сделка
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">Теги:</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-indigo-600 text-white'
                  : tagColor(tag) + ' opacity-70 hover:opacity-100'
              }`}
            >{tag}</button>
          ))}
          {selectedTags.length > 0 && (
            <button onClick={() => setSelectedTags([])} className="text-xs text-gray-400 hover:text-gray-600 ml-1">
              сбросить
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-x-auto p-6 bg-gray-50 dark:bg-gray-950">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-h-96">
            {stages.map(stage => (
              <div key={stage.id} className="flex flex-col w-64 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{stage.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{stageDeals(stage.id).length}</span>
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl p-2 min-h-24 space-y-2 transition-colors ${
                        snapshot.isDraggingOver
                          ? stage.name === 'Проиграна' ? 'bg-red-50 dark:bg-red-950'
                          : stage.name === 'Выполнено' ? 'bg-green-50 dark:bg-green-950'
                          : 'bg-indigo-50 dark:bg-indigo-950'
                          : stage.name === 'Проиграна' ? 'bg-red-50/50 dark:bg-red-950/30'
                          : stage.name === 'Выполнено' ? 'bg-green-50/50 dark:bg-green-950/30'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}
                    >
                      {stageDeals(stage.id).map((deal, index) => {
                        const badge = statusBadge[deal.status]
                        return (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border cursor-grab ${
                                  deal.status === 'WON' ? 'border-green-200 dark:border-green-800' :
                                  deal.status === 'LOST' ? 'border-red-200 dark:border-red-900 opacity-70' :
                                  'border-gray-100 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <Link href={`/deals/${deal.id}`} className="font-medium text-sm text-gray-900 leading-snug hover:text-indigo-600 hover:underline">{deal.title}</Link>
                                  <button onClick={() => deleteDeal(deal.id)} className="text-gray-200 hover:text-red-400 flex-shrink-0 mt-0.5">
                                    <X size={13} />
                                  </button>
                                </div>
                                {deal.amount > 0 && (
                                  <div className="text-indigo-600 font-semibold text-sm mt-1">
                                    {formatCurrency(deal.amount)}
                                  </div>
                                )}
                                {deal.contact && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    {deal.contact.firstName} {deal.contact.lastName}
                                  </div>
                                )}
                                {deal.assignedTo && (
                                  <div className="text-xs text-gray-400">{deal.assignedTo.name}</div>
                                )}
                                {parseTags(deal.tags).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {parseTags(deal.tags).map(tag => (
                                      <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>{tag}</span>
                                    ))}
                                  </div>
                                )}

                                {badge.label && (
                                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 font-medium ${badge.cls}`}>
                                    {badge.label}
                                  </span>
                                )}

                                {deal.status === 'OPEN' && (
                                  <div className="flex gap-1 mt-2">
                                    <button
                                      onClick={() => setStatus(deal.id, 'WON')}
                                      className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded hover:bg-green-100"
                                    >Выиграна</button>
                                    <button
                                      onClick={() => setLostModal({ dealId: deal.id, reasons: [] })}
                                      className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100"
                                    >Проиграна</button>
                                  </div>
                                )}
                                {deal.status === 'LOST' && deal.lostReason && (
                                  <div className="text-xs text-red-400 mt-1 italic">«{deal.lostReason}»</div>
                                )}
                                {deal.status !== 'OPEN' && (
                                  <button
                                    onClick={() => setStatus(deal.id, 'OPEN')}
                                    className="text-xs text-gray-400 hover:text-indigo-500 mt-1"
                                  >↩ Вернуть в работу</button>
                                )}
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {lostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Причина отказа</h2>
              <button onClick={() => setLostModal(null)}><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Можно выбрать несколько</p>
            <div className="space-y-2">
              {LOST_REASONS.map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={lostModal.reasons.includes(reason)}
                    onChange={() => toggleLostReason(reason)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                    {reason}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setLostModal(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
              >Отмена</button>
              <button
                onClick={confirmLost}
                disabled={lostModal.reasons.length === 0}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600 disabled:opacity-40"
              >Закрыть сделку</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl dark:shadow-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Новая сделка</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  value={newDeal.title}
                  onChange={e => setNewDeal(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Название сделки"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                <input
                  type="number"
                  value={newDeal.amount}
                  onChange={e => setNewDeal(p => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Стадия *</label>
                <select
                  value={newDeal.stageId}
                  onChange={e => setNewDeal(p => ({ ...p, stageId: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Теги</label>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {PRESET_TAGS.map(tag => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={newDealTagsChecked.includes(tag)}
                        onChange={() => setNewDealTagsChecked(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        )}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">{tag}</span>
                    </label>
                  ))}
                </div>
                <input
                  value={newDealTagsCustom}
                  onChange={e => setNewDealTagsCustom(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Свои теги через запятую..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >Отмена</button>
                <button
                  onClick={createDeal}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700"
                >Создать</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
