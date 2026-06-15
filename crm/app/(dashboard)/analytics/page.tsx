'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/header'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface AnalyticsData {
  stageStats: { name: string; count: number; total: number }[]
  dealsByMonth: { month: string; count: number; total: number }[]
  managerStats: { name: string; wonDeals: number; wonAmount: number }[]
  taskStats: { status: string; _count: { status: number } }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(setData)
  }, [])

  if (!data || !data.stageStats) return (
    <div className="flex flex-col flex-1">
      <Header title="Аналитика" />
      <div className="flex-1 flex items-center justify-center text-gray-400">Загрузка...</div>
    </div>
  )

  const totalDeals = data.stageStats.reduce((sum, s) => sum + s.count, 0)
  const totalAmount = data.stageStats.reduce((sum, s) => sum + s.total, 0)

  const taskStatusLabels: Record<string, string> = {
    PENDING: 'Ожидают', IN_PROGRESS: 'В работе', DONE: 'Выполнено', OVERDUE: 'Просрочено',
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Аналитика" />
      <div className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Всего открытых сделок</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalDeals}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Общая сумма воронки</div>
            <div className="text-3xl font-bold text-indigo-600">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Сделки по стадиям</h2>
          <div className="space-y-3">
            {data.stageStats.map(s => (
              <div key={s.name} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600 truncate">{s.name}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${totalDeals ? Math.max(4, (s.count / totalDeals) * 100) : 4}%` }}
                  >
                    <span className="text-white text-xs font-medium">{s.count}</span>
                  </div>
                </div>
                <div className="w-28 text-right text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(s.total)}</div>
              </div>
            ))}
            {data.stageStats.length === 0 && <p className="text-gray-400 text-sm">Нет данных</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Сделки по месяцам</h2>
          {data.dealsByMonth.length === 0 ? (
            <p className="text-gray-400 text-sm">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...data.dealsByMonth].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Сумма']} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Топ менеджеры</h2>
            {data.managerStats.length === 0 ? (
              <p className="text-gray-400 text-sm">Нет закрытых сделок</p>
            ) : (
              <div className="space-y-3">
                {data.managerStats.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600 font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{m.wonDeals} сделок</div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">{formatCurrency(m.wonAmount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Статус задач</h2>
            <div className="space-y-3">
              {data.taskStats.map(t => (
                <div key={t.status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{taskStatusLabels[t.status] || t.status}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t._count.status}</span>
                </div>
              ))}
              {data.taskStats.length === 0 && <p className="text-gray-400 text-sm">Нет задач</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}