import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/companies')

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  const search = request.nextUrl.searchParams.get('search') || ''

  try {
    const companies = await prisma.company.findMany({
      where: search ? { name: { contains: search } } : undefined,
      include: {
        _count: { select: { contacts: true, deals: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(companies)
  } catch (error) {
    log.error('Ошибка получения компаний', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const body = await request.json()
    const company = await prisma.company.create({
      data: {
        name: body.name,
        inn: body.inn || null,
        website: body.website || null,
        address: body.address || null,
        phones: JSON.stringify(body.phones || []),
      },
    })
    log.info('Создана компания', { companyId: company.id, userId: session.user.id })
    return Response.json(company, { status: 201 })
  } catch (error) {
    log.error('Ошибка создания компании', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
