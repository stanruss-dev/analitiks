import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getLogger } from '@/lib/logger'

const log = getLogger('api/pipelines')

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Не авторизован' }, { status: 401 })

  try {
    const pipelines = await prisma.pipeline.findMany({
      include: { stages: { orderBy: { order: 'asc' } } },
    })
    return Response.json(pipelines)
  } catch (error) {
    log.error('Ошибка получения воронок', error)
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
