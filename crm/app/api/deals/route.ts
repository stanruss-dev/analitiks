import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/deals')

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const deals = await prisma.deal.findMany({
      include: {
        stage: true,
        contact: true,
        company: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(deals)
  } catch (error) {
    log.error('Ошибка получения сделок', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const body = await request.json()
    const deal = await prisma.deal.create({
      data: {
        title: body.title,
        amount: body.amount || 0,
        stageId: body.stageId,
        contactId: body.contactId || null,
        companyId: body.companyId || null,
        assignedToId: body.assignedToId || null,
        tags: JSON.stringify(body.tags || []),
        closedAt: body.closedAt ? new Date(body.closedAt) : null,
      },
      include: { stage: true, contact: true, company: true, assignedTo: { select: { id: true, name: true } } },
    })

    await prisma.activity.create({
      data: {
        type: 'DEAL_CREATED',
        content: `Создана сделка "${deal.title}"`,
        userId: session.user.id,
        dealId: deal.id,
      },
    })

    log.info('Создана сделка', { dealId: deal.id, title: deal.title, userId: session.user.id })
    return Response.json(deal, { status: 201 })
  } catch (error) {
    log.error('Ошибка создания сделки', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
