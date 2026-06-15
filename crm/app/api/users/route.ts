import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/users')

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'Доступ запрещён' }, { status: 403 })

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return Response.json(users)
  } catch (error) {
    log.error('Ошибка получения пользователей', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return Response.json({ error: 'Доступ запрещён' }, { status: 403 })

  try {
    const body = await request.json()
    const hashed = await hash(body.password, 12)
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashed,
        role: body.role || 'USER',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    log.info('Создан пользователь', { userId: user.id, by: session.user.id })
    return Response.json(user, { status: 201 })
  } catch (error) {
    log.error('Ошибка создания пользователя', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
