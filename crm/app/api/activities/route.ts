import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/activities')

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const activities = await prisma.activity.findMany({
      include: {
        user: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return Response.json(activities)
  } catch (error) {
    log.error('Ошибка получения активностей', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const body = await request.json()
    const activity = await prisma.activity.create({
      data: {
        type: body.type || 'NOTE',
        content: body.content,
        userId: session.user.id,
        dealId: body.dealId || null,
        contactId: body.contactId || null,
      },
      include: {
        user: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    log.info('Создана активность', { activityId: activity.id, type: activity.type, userId: session.user.id })
    return Response.json(activity, { status: 201 })
  } catch (error) {
    log.error('Ошибка создания активности', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
