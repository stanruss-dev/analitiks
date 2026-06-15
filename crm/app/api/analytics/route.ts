import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/analytics')

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const [dealsByStage, allDeals, topManagers, taskStats, wonStats] = await Promise.all([
      prisma.stage.findMany({
        include: {
          deals: { where: { status: { in: ['OPEN', 'WON'] } }, select: { amount: true, status: true } },
        },
        orderBy: { order: 'asc' },
      }),
      prisma.deal.findMany({
        where: { status: { in: ['OPEN', 'WON'] } },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        include: {
          deals: {
            where: { status: 'WON' },
            select: { amount: true },
          },
        },
        take: 10,
      }),
      prisma.task.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.deal.aggregate({
        where: { status: 'WON' },
        _count: { id: true },
        _sum: { amount: true },
      }),
    ])

    const stageStats = dealsByStage.map(s => ({
      name: s.name,
      count: s.deals.length,
      total: s.deals.reduce((sum, d) => sum + d.amount, 0),
    }))

    const wonTotal = { count: wonStats._count.id, amount: wonStats._sum.amount ?? 0 }

    // Группируем сделки по месяцам вручную
    const monthMap = new Map<string, { count: number; total: number }>()
    for (const deal of allDeals) {
      const month = deal.createdAt.toISOString().slice(0, 7)
      const existing = monthMap.get(month) || { count: 0, total: 0 }
      monthMap.set(month, { count: existing.count + 1, total: existing.total + deal.amount })
    }
    const dealsByMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12)

    const managerStats = topManagers
      .map(u => ({
        name: u.name,
        wonDeals: u.deals.length,
        wonAmount: u.deals.reduce((sum, d) => sum + d.amount, 0),
      }))
      .filter(m => m.wonDeals > 0)
      .sort((a, b) => b.wonAmount - a.wonAmount)
      .slice(0, 5)

    return Response.json({ stageStats, dealsByMonth, managerStats, taskStats, wonTotal })
  } catch (error) {
    log.error('Ошибка получения аналитики', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
