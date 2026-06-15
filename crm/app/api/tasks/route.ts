import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/tasks')

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  const status = request.nextUrl.searchParams.get('status')

  try {
    const tasks = await prisma.task.findMany({
      where: status ? { status: status as 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE' } : undefined,
      include: {
        assignedTo: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    })
    return Response.json(tasks)
  } catch (error) {
    log.error('Ошибка получения задач', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const body = await request.json()
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type || 'TASK',
        priority: body.priority || 'MEDIUM',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignedToId: body.assignedToId || null,
        dealId: body.dealId || null,
        contactId: body.contactId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    await prisma.activity.create({
      data: {
        type: 'TASK_CREATED',
        content: `Создана задача "${task.title}"`,
        userId: session.user.id,
        dealId: task.dealId,
        contactId: task.contactId,
      },
    })

    log.info('Создана задача', { taskId: task.id, userId: session.user.id })
    return Response.json(task, { status: 201 })
  } catch (error) {
    log.error('Ошибка создания задачи', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
