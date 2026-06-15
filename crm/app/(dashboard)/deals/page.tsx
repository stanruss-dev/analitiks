'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Header } from '@/components/header'
import { formatCurrency } from '@/lib/utils'
import { Plus, X } from 'lucide-react'

interface Stage { id: string; name: string; color: string; order: number }
interface Deal {
  id: string; title: string; amount: number; stageId: string; status: string
  contact?: { firstName: string; lastName: string } | null
  assignedTo?: { name: string } | null
  tags: string
}

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

    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stageId: newStageId } : d))

    await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId: newStageId }),
    })
  }

  async function createDeal() {
    if (!newDeal.title || !newDeal.stageId) return
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newDeal, amount: parseFloat(newDeal.amount) || 0 }),
    })
    if (res.ok) {
      const deal = await res.json()
      setDeals(prev => [...prev, deal])
      setNewDeal({ title: '', amount: '', stageId: stages[0]?.id || '' })
      setShowModal(false)
    }
  }

  async function setStatus(id: string, status: 'WON' | 'LOST' | 'OPEN') {
    await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status } : d))
  }

  async function deleteDeal(id: string) {
    await fetch(`/api/deals/${id}`, { method: 'DELETE' })
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const stageDeals = (stageId: string) => deals.filter(d => d.stageId === stageId)
  const openCount = deals.filter(d => d.status === 'OPEN').length
  const wonCount  = deals.filter(d => d.status === 'WON').length
  const lostCount = deals.filter(d => d.status === 'LOST').length

  return (
    <div className="flex flex-col flex-1">
      <Header title="Воронка сделок" />
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Открытых: <b className="text-gray-900">{openCount}</b></span>
          <span className="text-gray-500">Выиграно: <b className="text-green-600">{wonCount}</b></span>
          <span className="text-gray-500">Проиграно: <b className="text-red-500">{lostCount}</b></span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Новая сделка
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-h-96">
            {stages.map(stage => (
              <div key={stage.id} className="flex flex-col w-64 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="font-medium text-sm text-gray-700">{stage.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{stageDeals(stage.id).length}</span>
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl p-2 min-h-24 space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-indigo-50' : 'bg-gray-100'
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
                                className={`bg-white rounded-lg p-3 shadow-sm border cursor-grab ${
                                  deal.status === 'WON' ? 'border-green-200' :
                                  deal.status === 'LOST' ? 'border-red-200 opacity-70' :
                                  'border-gray-100'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-medium text-sm text-gray-900 leading-snug">{deal.title}</span>
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
                                      onClick={() => setStatus(deal.id, 'LOST')}
                                      className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100"
                                    >Проиграна</button>
                                  </div>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Новая сделка</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  value={newDeal.title}
                  onChange={e => setNewDeal(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Название сделки"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                <input
                  type="number"
                  value={newDeal.amount}
                  onChange={e => setNewDeal(p => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Стадия *</label>
                <select
                  value={newDeal.stageId}
                  onChange={e => setNewDeal(p => ({ ...p, stageId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
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
