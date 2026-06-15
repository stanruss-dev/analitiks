'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/header'
import { parseJson } from '@/lib/utils'
import { Search, Plus, X, Phone, Mail } from 'lucide-react'

interface Contact {
  id: string; firstName: string; lastName: string; phones: string; emails: string
  position: string | null; tags: string
  company?: { id: string; name: string } | null
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', position: '' })

  const load = useCallback(async () => {
    const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}`)
    const data = await res.json()
    setContacts(Array.isArray(data) ? data : [])
  }, [search])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditContact(null)
    setForm({ firstName: '', lastName: '', phone: '', email: '', position: '' })
    setShowModal(true)
  }

  function openEdit(c: Contact) {
    setEditContact(c)
    const phones = parseJson<string[]>(c.phones, [])
    const emails = parseJson<string[]>(c.emails, [])
    setForm({ firstName: c.firstName, lastName: c.lastName, phone: phones[0] || '', email: emails[0] || '', position: c.position || '' })
    setShowModal(true)
  }

  async function save() {
    const body = {
      firstName: form.firstName,
      lastName: form.lastName,
      phones: form.phone ? [form.phone] : [],
      emails: form.email ? [form.email] : [],
      position: form.position,
    }
    if (editContact) {
      const res = await fetch(`/api/contacts/${editContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setShowModal(false); load() }
    } else {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) { setShowModal(false); load() }
    }
  }

  async function del(id: string) {
    if (!confirm('Удалить контакт?')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Контакты" />
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск контактов..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Должность</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Компания</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Контакты</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {contacts.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">Контактов не найдено</td></tr>
              )}
              {contacts.map(c => {
                const phones = parseJson<string[]>(c.phones, [])
                const emails = parseJson<string[]>(c.emails, [])
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(c)} className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900 hover:text-indigo-600">
                          {c.firstName} {c.lastName}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.position || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.company?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {phones[0] && <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Phone size={12} />{phones[0]}</span>}
                        {emails[0] && <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Mail size={12} />{emails[0]}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => del(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl dark:shadow-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editContact ? 'Редактировать' : 'Новый контакт'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Имя *</label>
                  <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Иван" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Фамилия *</label>
                  <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Иванов" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Должность</label>
                <input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="Директор" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Телефон</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="+7 900 000 00 00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="ivan@example.com" />
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