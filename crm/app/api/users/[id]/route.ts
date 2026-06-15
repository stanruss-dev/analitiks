import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/users/[id]')

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/users/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'Доступ запрещён' }, { status: 403 })
  const { id } = await ctx.params

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name) data.name = body.name
    if (body.role) data.role = body.role
    if (body.password) data.password = await hash(body.password, 12)

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    log.info('Обновлён пользователь', { userId: id, by: session.user.id })
    return Response.json(user)
  } catch (error) {
    log.error('Ошибка обновления пользователя', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/users/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'Доступ запрещён' }, { status: 403 })
  const { id } = await ctx.params

  if (id === session.user.id) return Response.json({ error: 'Нельзя удалить себя' }, { status: 400 })

  try {
    await prisma.user.delete({ where: { id } })
    log.info('Удалён пользователь', { userId: id, by: session.user.id })
    return Response.json({ ok: true })
  } catch (error) {
    log.error('Ошибка удаления пользователя', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
