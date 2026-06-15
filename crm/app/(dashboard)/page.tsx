import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/header'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, Building2, CheckSquare } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [dealsCount, contactsCount, companiesCount, tasksTodayCount, openDeals, recentActivities] =
    await Promise.all([
      prisma.deal.count({ where: { status: 'OPEN' } }),
      prisma.contact.count(),
      prisma.company.count(),
      prisma.task.count({ where: { dueDate: { gte: today, lt: tomorrow }, status: { not: 'DONE' } } }),
      prisma.deal.findMany({
        where: { status: 'OPEN' },
        include: { stage: true, assignedTo: true, contact: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.activity.findMany({
        include: { user: true, deal: true, contact: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])

  const totalAmount = await prisma.deal.aggregate({
    where: { status: 'OPEN' },
    _sum: { amount: true },
  })

  const stats = [
    { label: 'Открытые сделки', value: dealsCount, icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Сумма сделок', value: formatCurrency(totalAmount._sum.amount || 0), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Контакты', value: contactsCount, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Компании', value: companiesCount, icon: Building2, color: 'bg-purple-50 text-purple-600' },
    { label: 'Задачи на сегодня', value: tasksTodayCount, icon: CheckSquare, color: 'bg-orange-50 text-orange-600' },
  ]

  const activityLabels: Record<string, string> = {
    NOTE: '📝 Заметка',
    CALL_LOG: '📞 Звонок',
    STATUS_CHANGE: '🔄 Смена статуса',
    DEAL_CREATED: '💼 Новая сделка',
    CONTACT_CREATED: '👤 Новый контакт',
    TASK_CREATED: '✅ Новая задача',
    TASK_COMPLETED: '✔️ Задача выполнена',
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Дашборд" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Последние сделки</h2>
            <div className="space-y-3">
              {openDeals.length === 0 && <p className="text-gray-400 text-sm">Нет открытых сделок</p>}
              {openDeals.map(deal => (
                <div key={deal.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                    <div className="text-xs text-gray-400">{deal.stage.name} · {deal.assignedTo?.name || 'Не назначен'}</div>
                  </div>
                  <div className="text-sm font-semibold text-indigo-600">{formatCurrency(deal.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Последние события</h2>
            <div className="space-y-3">
              {recentActivities.length === 0 && <p className="text-gray-400 text-sm">Нет событий</p>}
              {recentActivities.map(act => (
                <div key={act.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-600">{activityLabels[act.type] || act.type}</div>
                    <div className="text-sm text-gray-700 mt-0.5">{act.content}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{act.user.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
