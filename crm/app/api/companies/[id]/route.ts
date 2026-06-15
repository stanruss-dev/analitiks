import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/companies/[id]')

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/companies/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const body = await request.json()
    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.inn !== undefined && { inn: body.inn }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.phones !== undefined && { phones: JSON.stringify(body.phones) }),
      },
    })
    log.info('Обновлена компания', { companyId: id, userId: session.user.id })
    return Response.json(company)
  } catch (error) {
    log.error('Ошибка обновления компании', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/companies/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  const { id } = await ctx.params

  try {
    await prisma.company.delete({ where: { id } })
    log.info('Удалена компания', { companyId: id, userId: session.user.id })
    return Response.json({ ok: true })
  } catch (error) {
    log.error('Ошибка удаления компании', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
