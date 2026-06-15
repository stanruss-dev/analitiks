import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hash } from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  const adminPassword = await hash('admin123', 12)
  const managerPassword = await hash('manager123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.ru' },
    update: {},
    create: { name: 'Администратор', email: 'admin@crm.ru', password: adminPassword, role: 'ADMIN' },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@crm.ru' },
    update: {},
    create: { name: 'Иван Петров', email: 'manager@crm.ru', password: managerPassword, role: 'MANAGER' },
  })

  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'default-pipeline' },
    update: {},
    create: {
      id: 'default-pipeline',
      name: 'Основная воронка',
      stages: {
        create: [
          { name: 'Новые',              order: 1,  color: '#6366f1' },
          { name: 'В обработке',        order: 2,  color: '#8b5cf6' },
          { name: 'Квалификация',       order: 3,  color: '#a855f7' },
          { name: 'Встреча назначена',  order: 4,  color: '#3b82f6' },
          { name: 'Подготовка КП',      order: 5,  color: '#06b6d4' },
          { name: 'Выставить счёт',     order: 6,  color: '#f59e0b' },
          { name: 'Согласовано',        order: 7,  color: '#f97316' },
          { name: 'Ждёт оплаты',        order: 8,  color: '#ef4444' },
          { name: 'Оплачено',           order: 9,  color: '#84cc16' },
          { name: 'Ждёт поставки',      order: 10, color: '#14b8a6' },
          { name: 'Выполнено',          order: 11, color: '#10b981' },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  })

  const stages = pipeline.stages

  const company1 = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'ООО ТехноСтарт',
      inn: '7700000001',
      website: 'https://technostart.ru',
      address: 'Москва, ул. Ленина, 1',
      phones: JSON.stringify(['+7 495 000 01 01']),
    },
  })

  const company2 = await prisma.company.upsert({
    where: { id: 'company-2' },
    update: {},
    create: {
      id: 'company-2',
      name: 'АО МегаТрейд',
      inn: '7700000002',
      website: 'https://megatrade.ru',
      address: 'Санкт-Петербург, Невский пр., 10',
      phones: JSON.stringify(['+7 812 000 02 02']),
    },
  })

  const contact1 = await prisma.contact.upsert({
    where: { id: 'contact-1' },
    update: {},
    create: {
      id: 'contact-1',
      firstName: 'Алексей',
      lastName: 'Смирнов',
      phones: JSON.stringify(['+7 916 100 01 01']),
      emails: JSON.stringify(['a.smirnov@technostart.ru']),
      position: 'Генеральный директор',
      companyId: company1.id,
    },
  })

  const contact2 = await prisma.contact.upsert({
    where: { id: 'contact-2' },
    update: {},
    create: {
      id: 'contact-2',
      firstName: 'Мария',
      lastName: 'Козлова',
      phones: JSON.stringify(['+7 911 200 02 02']),
      emails: JSON.stringify(['m.kozlova@megatrade.ru']),
      position: 'Директор по закупкам',
      companyId: company2.id,
    },
  })

  const contact3 = await prisma.contact.upsert({
    where: { id: 'contact-3' },
    update: {},
    create: {
      id: 'contact-3',
      firstName: 'Дмитрий',
      lastName: 'Орлов',
      phones: JSON.stringify(['+7 925 300 03 03']),
      emails: JSON.stringify(['d.orlov@gmail.com']),
      position: 'Финансовый директор',
    },
  })

  await prisma.deal.upsert({
    where: { id: 'deal-1' },
    update: {},
    create: {
      id: 'deal-1',
      title: 'Внедрение CRM для ТехноСтарт',
      amount: 350000,
      stageId: stages[1].id,
      contactId: contact1.id,
      companyId: company1.id,
      assignedToId: manager.id,
      tags: JSON.stringify(['crm', 'внедрение']),
    },
  })

  await prisma.deal.upsert({
    where: { id: 'deal-2' },
    update: {},
    create: {
      id: 'deal-2',
      title: 'Поставка оборудования МегаТрейд',
      amount: 1200000,
      stageId: stages[2].id,
      contactId: contact2.id,
      companyId: company2.id,
      assignedToId: manager.id,
      tags: JSON.stringify(['оборудование', 'крупный']),
    },
  })

  await prisma.deal.upsert({
    where: { id: 'deal-3' },
    update: {},
    create: {
      id: 'deal-3',
      title: 'Консалтинг финансового отдела',
      amount: 180000,
      stageId: stages[0].id,
      contactId: contact3.id,
      assignedToId: admin.id,
    },
  })

  await prisma.task.upsert({
    where: { id: 'task-1' },
    update: {},
    create: {
      id: 'task-1',
      title: 'Позвонить Алексею Смирнову',
      type: 'CALL',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedToId: manager.id,
      dealId: 'deal-1',
      contactId: contact1.id,
    },
  })

  await prisma.task.upsert({
    where: { id: 'task-2' },
    update: {},
    create: {
      id: 'task-2',
      title: 'Подготовить коммерческое предложение',
      type: 'TASK',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assignedToId: manager.id,
      dealId: 'deal-2',
    },
  })

  try {
    await prisma.activity.create({
      data: {
        type: 'DEAL_CREATED',
        content: 'Создана сделка "Внедрение CRM для ТехноСтарт"',
        userId: admin.id,
        dealId: 'deal-1',
      },
    })
    await prisma.activity.create({
      data: {
        type: 'CONTACT_CREATED',
        content: 'Добавлен контакт Алексей Смирнов (ТехноСтарт)',
        userId: admin.id,
        contactId: contact1.id,
      },
    })
  } catch {}

  console.log('✅ База данных заполнена тестовыми данными')
  console.log('🔑 Логин: admin@crm.ru / admin123')
  console.log('🔑 Менеджер: manager@crm.ru / manager123')
}

main().finally(() => prisma.$disconnect())
