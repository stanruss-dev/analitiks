import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/contacts/[id]')

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/contacts/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  const { id } = await ctx.params

  try {
    const body = await request.json()
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.phones !== undefined && { phones: JSON.stringify(body.phones) }),
        ...(body.emails !== undefined && { emails: JSON.stringify(body.emails) }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.companyId !== undefined && { companyId: body.companyId }),
        ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
      },
      include: { company: { select: { id: true, name: true } } },
    })
    log.info('Обновлён контакт', { contactId: id, userId: session.user.id })
    return Response.json(contact)
  } catch (error) {
    log.error('Ошибка обновления контакта', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/contacts/[id]'>) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })
  const { id } = await ctx.params

  try {
    await prisma.contact.delete({ where: { id } })
    log.info('Удалён контакт', { contactId: id, userId: session.user.id })
    return Response.json({ ok: true })
  } catch (error) {
    log.error('Ошибка удаления контакта', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
