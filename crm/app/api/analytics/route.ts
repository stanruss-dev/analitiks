import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/analytics')

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const [dealsByStage, dealsByMonth, topManagers, taskStats] = await Promise.all([
      prisma.stage.findMany({
        include: {
          deals: { where: { status: 'OPEN' }, select: { amount: true } },
        },
        orderBy: { order: 'asc' },
      }),
      prisma.$queryRaw<{ month: string; count: number; total: number }[]>`
        SELECT
          strftime('%Y-%m', createdAt) as month,
          COUNT(*) as count,
          SUM(amount) as total
        FROM Deal
        WHERE status = 'OPEN'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `,
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
    ])

    const stageStats = dealsByStage.map(s => ({
      name: s.name,
      count: s.deals.length,
      total: s.deals.reduce((sum, d) => sum + d.amount, 0),
    }))

    const managerStats = topManagers
      .map(u => ({
        name: u.name,
        wonDeals: u.deals.length,
        wonAmount: u.deals.reduce((sum, d) => sum + d.amount, 0),
      }))
      .filter(m => m.wonDeals > 0)
      .sort((a, b) => b.wonAmount - a.wonAmount)
      .slice(0, 5)

    return Response.json({
      stageStats,
      dealsByMonth,
      managerStats,
      taskStats,
    })
  } catch (error) {
    log.error('Ошибка получения аналитики', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
