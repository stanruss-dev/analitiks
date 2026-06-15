import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/tasks/[id]')

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const body = await request.json()
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId }),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (body.status === 'DONE') {
      await prisma.activity.create({
        data: {
          type: 'TASK_COMPLETED',
          content: `Задача "${task.title}" выполнена`,
          userId: session.user.id,
          dealId: task.dealId,
          contactId: task.contactId,
        },
      })
    }

    log.info('Обновлена задача', { taskId: id, status: body.status, userId: session.user.id })
    return Response.json(task)
  } catch (error) {
    log.error('Ошибка обновления задачи', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/tasks/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  const { id } = await ctx.params

  try {
    await prisma.task.delete({ where: { id } })
    log.info('Удалена задача', { taskId: id, userId: session.user.id })
    return Response.json({ ok: true })
  } catch (error) {
    log.error('Ошибка удаления задачи', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
