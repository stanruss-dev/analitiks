'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Plus, X, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string; name: string; email: string; role: string; createdAt: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор', MANAGER: 'Менеджер', USER: 'Пользователь',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-600', MANAGER: 'bg-blue-50 text-blue-600', USER: 'bg-gray-50 text-gray-600 dark:text-gray-400',
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' })

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') router.push('/settings')
  }, [session, router])

  const load = useCallback(async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditUser(null)
    setForm({ name: '', email: '', password: '', role: 'USER' })
    setShowModal(true)
  }

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setShowModal(true)
  }

  async function save() {
    if (editUser) {
      const body: Record<string, string> = { name: form.name, role: form.role }
      if (form.password) body.password = form.password
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (res.ok) { setShowModal(false); load() }
    } else {
      const res = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (res.ok) { setShowModal(false); load() }
    }
  }

  async function del(id: string) {
    if (!confirm('Удалить пользователя?')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Пользователи" />
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <span className="text-sm text-gray-500 dark:text-gray-400">{users.length} пользователей</span>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Создан</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
                        {u.name[0]}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-indigo-600"><Pencil size={15} /></button>
                      {u.id !== session?.user.id && (
                        <button onClick={() => del(u.id)} className="text-gray-400 hover:text-red-500"><X size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl dark:shadow-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editUser ? 'Редактировать' : 'Новый пользователь'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Имя *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {editUser ? 'Новый пароль (оставьте пустым для сохранения)' : 'Пароль *'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Роль</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option value="USER">Пользователь</option>
                  <option value="MANAGER">Менеджер</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Отмена</button>
                <button onClick={save}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}