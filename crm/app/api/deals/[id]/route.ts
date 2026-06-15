import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/deals/[id]')

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/deals/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  const { id } = await ctx.params

  try {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        stage: true,
        contact: true,
        company: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        tasks: {
          include: { assignedTo: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!deal) return Response.json({ error: 'Не найдено' }, { status: 404 })
    return Response.json(deal)
  } catch (error) {
    log.error('Ошибка получения сделки', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/deals/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  const { id } = await ctx.params

  try {
    const body = await request.json()
    const existing = await prisma.deal.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: 'Не найдено' }, { status: 404 })

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.stageId !== undefined && { stageId: body.stageId }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.contactId !== undefined && { contactId: body.contactId }),
        ...(body.companyId !== undefined && { companyId: body.companyId }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
        ...(body.closedAt !== undefined && { closedAt: body.closedAt ? new Date(body.closedAt) : null }),
      },
      include: { stage: true, contact: true, company: true, assignedTo: { select: { id: true, name: true } } },
    })

    if (body.stageId && body.stageId !== existing.stageId) {
      await prisma.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          content: `Сделка "${deal.title}" перемещена в стадию "${deal.stage.name}"`,
          userId: session.user.id,
          dealId: deal.id,
        },
      })
    }

    log.info('Обновлена сделка', { dealId: id, userId: session.user.id })
    return Response.json(deal)
  } catch (error) {
    log.error('Ошибка обновления сделки', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/deals/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  const { id } = await ctx.params

  try {
    await prisma.deal.delete({ where: { id } })
    log.info('Удалена сделка', { dealId: id, userId: session.user.id })
    return Response.json({ ok: true })
  } catch (error) {
    log.error('Ошибка удаления сделки', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
