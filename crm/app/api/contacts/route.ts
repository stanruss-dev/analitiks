import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/contacts')

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  const search = request.nextUrl.searchParams.get('search') || ''

  try {
    const contacts = await prisma.contact.findMany({
      where: search ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { emails: { contains: search } },
        ],
      } : undefined,
      include: { company: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(contacts)
  } catch (error) {
    log.error('Ошибка получения контактов', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const body = await request.json()
    const contact = await prisma.contact.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phones: JSON.stringify(body.phones || []),
        emails: JSON.stringify(body.emails || []),
        position: body.position || null,
        companyId: body.companyId || null,
        tags: JSON.stringify(body.tags || []),
      },
      include: { company: { select: { id: true, name: true } } },
    })

    await prisma.activity.create({
      data: {
        type: 'CONTACT_CREATED',
        content: `Создан контакт "${contact.firstName} ${contact.lastName}"`,
        userId: session.user.id,
        contactId: contact.id,
      },
    })

    log.info('Создан контакт', { contactId: contact.id, userId: session.user.id })
    return Response.json(contact, { status: 201 })
  } catch (error) {
    log.error('Ошибка создания контакта', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
