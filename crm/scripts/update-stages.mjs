import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, '../prisma/dev.db'))

const PIPELINE_ID = 'default-pipeline'

const newStages = [
  { name: 'Новые',             order: 1,  color: '#6366f1' },
  { name: 'В обработке',       order: 2,  color: '#8b5cf6' },
  { name: 'Квалификация',      order: 3,  color: '#a855f7' },
  { name: 'Встреча назначена', order: 4,  color: '#3b82f6' },
  { name: 'Подготовка КП',     order: 5,  color: '#06b6d4' },
  { name: 'Выставить счёт',    order: 6,  color: '#f59e0b' },
  { name: 'Согласовано',       order: 7,  color: '#f97316' },
  { name: 'Ждёт оплаты',       order: 8,  color: '#ef4444' },
  { name: 'Оплачено',          order: 9,  color: '#84cc16' },
  { name: 'Ждёт поставки',     order: 10, color: '#14b8a6' },
  { name: 'Выполнено',         order: 11, color: '#10b981' },
]

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const migrate = db.transaction(() => {
  // Генерируем ID для новых стадий заранее
  const stageIds = newStages.map(() => generateId())

  // Вставляем все новые стадии
  const insertStage = db.prepare(`
    INSERT INTO Stage (id, name, "order", color, pipelineId)
    VALUES (?, ?, ?, ?, ?)
  `)
  for (let i = 0; i < newStages.length; i++) {
    const s = newStages[i]
    insertStage.run(stageIds[i], s.name, s.order, s.color, PIPELINE_ID)
  }

  // Переносим все существующие сделки на первую новую стадию
  const placeholders = stageIds.map(() => '?').join(',')
  db.prepare(`UPDATE Deal SET stageId = ? WHERE stageId NOT IN (${placeholders})`)
    .run(stageIds[0], ...stageIds)

  // Удаляем старые стадии
  db.prepare(`DELETE FROM Stage WHERE pipelineId = ? AND id NOT IN (${placeholders})`)
    .run(PIPELINE_ID, ...stageIds)

  console.log('Стадии обновлены:')
  newStages.forEach((s, i) => console.log(`  ${s.order}. ${s.name}`))
})

migrate()
db.close()
console.log('Готово.')
