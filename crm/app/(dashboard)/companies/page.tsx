'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/header'
import { parseJson } from '@/lib/utils'
import { Search, Plus, X, Globe, Phone } from 'lucide-react'

interface Company {
  id: string; name: string; inn: string | null; website: string | null
  address: string | null; phones: string
  _count?: { contacts: number; deals: number }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [form, setForm] = useState({ name: '', inn: '', website: '', address: '', phone: '' })

  const load = useCallback(async () => {
    const res = await fetch(`/api/companies?search=${encodeURIComponent(search)}`)
    const data = await res.json()
    setCompanies(Array.isArray(data) ? data : [])
  }, [search])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditCompany(null)
    setForm({ name: '', inn: '', website: '', address: '', phone: '' })
    setShowModal(true)
  }

  function openEdit(c: Company) {
    setEditCompany(c)
    const phones = parseJson<string[]>(c.phones, [])
    setForm({ name: c.name, inn: c.inn || '', website: c.website || '', address: c.address || '', phone: phones[0] || '' })
    setShowModal(true)
  }

  async function save() {
    const body = { ...form, phones: form.phone ? [form.phone] : [] }
    if (editCompany) {
      const res = await fetch(`/api/companies/${editCompany.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (res.ok) { setShowModal(false); load() }
    } else {
      const res = await fetch('/api/companies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (res.ok) { setShowModal(false); load() }
    }
  }

  async function del(id: string) {
    if (!confirm('Удалить компанию?')) return
    await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Компании" />
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск компаний..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ИНН</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Контакты/Сделки</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Сайт/Телефон</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-8">Компаний не найдено</td></tr>
              )}
              {companies.map(c => {
                const phones = parseJson<string[]>(c.phones, [])
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(c)} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold text-xs">
                          {c.name[0]}
                        </div>
                        <span className="font-medium text-gray-900 hover:text-indigo-600">{c.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.inn || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c._count?.contacts ?? 0} / {c._count?.deals ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-500 hover:underline"><Globe size={12} />{c.website}</a>}
                        {phones[0] && <span className="flex items-center gap-1 text-gray-500"><Phone size={12} />{phones[0]}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => del(c.id)} className="text-gray-300 hover:text-red-500">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editCompany ? 'Редактировать' : 'Новая компания'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Название *', key: 'name', placeholder: 'ООО Пример' },
                { label: 'ИНН', key: 'inn', placeholder: '7700000000' },
                { label: 'Сайт', key: 'website', placeholder: 'https://example.com' },
                { label: 'Адрес', key: 'address', placeholder: 'Москва, ул. Пример, 1' },
                { label: 'Телефон', key: 'phone', placeholder: '+7 495 000 00 00' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Отмена</button>
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
