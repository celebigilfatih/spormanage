'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Shield, Plus, RefreshCw, Trash2, Edit, Key, CheckCircle,
  XCircle, AlertTriangle, Calendar, Users, Globe, Database
} from 'lucide-react'

interface License {
  id: number
  licenseKey: string
  customerName: string
  databaseName: string | null
  domain: string | null
  planType: string
  monthlyFee: number
  startDate: string
  expiryDate: string
  isActive: boolean
  maxStudents: number
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

const SUPER_KEY = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('key') || ''
  : ''

function apiUrl(path: string) {
  return `${path}${path.includes('?') ? '&' : '?'}key=${SUPER_KEY}`
}

function daysLeft(expiry: string): number {
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('tr-TR')
}

function StatusBadge({ license }: { license: License }) {
  const days = daysLeft(license.expiryDate)
  if (!license.isActive) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Askıda</span>
  if (days <= 0) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Süresi Dolmuş</span>
  if (days <= 7) return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{days} gün kaldı</span>
  if (days <= 30) return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">{days} gün kaldı</span>
  return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Aktif</span>
}

const emptyForm = {
  licenseKey: '', customerName: '', databaseName: '', domain: '',
  planType: 'MONTHLY', monthlyFee: 3000, startDate: '', expiryDate: '',
  maxStudents: 0, contactName: '', contactEmail: '', contactPhone: '', notes: '',
}

export default function LicenseAdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const fetchLicenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/license-admin'))
      if (!res.ok) {
        setError('Yetkisiz erişim veya sunucu hatası')
        setLicenses([])
        return
      }
      const data = await res.json()
      setLicenses(data.licenses || [])
      setError('')
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated) fetchLicenses()
  }, [isLoading, isAuthenticated, fetchLicenses])

  const generateKey = async () => {
    try {
      const res = await fetch(apiUrl('/api/license-admin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-key' }),
      })
      const data = await res.json()
      if (data.key) setForm(f => ({ ...f, licenseKey: data.key }))
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.customerName || !form.startDate || !form.expiryDate) {
      setError('Müşteri adı, başlangıç ve bitiş tarihi zorunludur')
      return
    }

    try {
      if (editId) {
        await fetch(apiUrl('/api/license-admin'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...form }),
        })
      } else {
        await fetch(apiUrl('/api/license-admin'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setShowForm(false)
      setEditId(null)
      setForm(emptyForm)
      fetchLicenses()
    } catch {
      setError('İşlem başarısız')
    }
  }

  const handleEdit = (lic: License) => {
    setEditId(lic.id)
    setForm({
      licenseKey: lic.licenseKey,
      customerName: lic.customerName,
      databaseName: lic.databaseName || '',
      domain: lic.domain || '',
      planType: lic.planType,
      monthlyFee: lic.monthlyFee,
      startDate: typeof lic.startDate === 'string' ? lic.startDate.split('T')[0] : '',
      expiryDate: typeof lic.expiryDate === 'string' ? lic.expiryDate.split('T')[0] : '',
      maxStudents: lic.maxStudents,
      contactName: lic.contactName || '',
      contactEmail: lic.contactEmail || '',
      contactPhone: lic.contactPhone || '',
      notes: lic.notes || '',
    })
    setShowForm(true)
  }

  const handleToggleActive = async (lic: License) => {
    await fetch(apiUrl('/api/license-admin'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lic.id, isActive: !lic.isActive }),
    })
    fetchLicenses()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu lisansı silmek istediğinize emin misiniz?')) return
    await fetch(apiUrl(`/api/license-admin?id=${id}`), { method: 'DELETE' })
    fetchLicenses()
  }

  const handleExtend = async (lic: License) => {
    const currentExpiry = new Date(lic.expiryDate)
    const months = lic.planType === 'YEARLY' ? 12 : 1
    currentExpiry.setMonth(currentExpiry.getMonth() + months)
    await fetch(apiUrl('/api/license-admin'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lic.id,
        expiryDate: currentExpiry.toISOString().split('T')[0],
      }),
    })
    fetchLicenses()
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen"><RefreshCw className="animate-spin" /></div>

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <Shield className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Giriş Yapılmadı</h2>
          <p className="text-gray-500 mb-4">Bu sayfaya erişim için giriş yapmalısınız.</p>
          <button onClick={() => router.push('/login')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Giriş Yap</button>
        </div>
      </div>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-500 mb-4">Lisans yönetim paneline erişim için <strong>ADMIN</strong> yetkisi gereklidir.</p>
          <p className="text-sm text-gray-400">Mevcut rolünüz: {user?.role || 'Bilinmiyor'}</p>
        </div>
      </div>
    )
  }

  // Stats
  const total = licenses.length
  const active = licenses.filter(l => l.isActive && daysLeft(l.expiryDate) > 0).length
  const expiring = licenses.filter(l => l.isActive && daysLeft(l.expiryDate) > 0 && daysLeft(l.expiryDate) <= 7).length
  const expired = licenses.filter(l => daysLeft(l.expiryDate) <= 0).length
  const totalRevenue = licenses.filter(l => l.isActive).reduce((s, l) => s + l.monthlyFee, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lisans Yönetimi</h1>
              <p className="text-xs text-gray-500">Müşteri lisanslarını yönetin</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLicenses} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-semibold">
              <Plus className="w-4 h-4" /> Yeni Lisans
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Toplam Lisans</div>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-green-600">{active}</div>
            <div className="text-xs text-gray-500">Aktif</div>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-amber-600">{expiring}</div>
            <div className="text-xs text-gray-500">Süresi Dolacak</div>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-red-600">{expired}</div>
            <div className="text-xs text-gray-500">Süresi Dolmuş</div>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <div className="text-2xl font-bold text-blue-600">{totalRevenue.toLocaleString('tr-TR')} ₺</div>
            <div className="text-xs text-gray-500">Aylık Gelir</div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-bold">{editId ? 'Lisans Düzenle' : 'Yeni Lisans Oluştur'}</h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lisans Anahtarı</label>
                  <div className="flex gap-2">
                    <input className="flex-1 border rounded-lg px-3 py-2 text-sm" value={form.licenseKey} onChange={e => setForm(f => ({ ...f, licenseKey: e.target.value }))} placeholder="Otomatik oluşturulur" />
                    <button onClick={generateKey} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200" title="Anahtar Oluştur"><Key className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veritabanı Adı</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.databaseName} onChange={e => setForm(f => ({ ...f, databaseName: e.target.value }))} placeholder="aidat_takip_xxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="musteri.spormanage.com.tr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.planType} onChange={e => setForm(f => ({ ...f, planType: e.target.value }))}>
                    <option value="MONTHLY">Aylık</option>
                    <option value="YEARLY">Yıllık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Ücret (₺)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.monthlyFee} onChange={e => setForm(f => ({ ...f, monthlyFee: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Öğrenci (0=sınırsız)</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İletişim Kişisi</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <button onClick={() => { setShowForm(false); setEditId(null); setError('') }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">İptal</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">{editId ? 'Güncelle' : 'Oluştur'}</button>
              </div>
            </div>
          </div>
        )}

        {/* License Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Müşteri</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Lisans</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ücret</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Bitiş</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400"><RefreshCw className="animate-spin inline mr-2" />Yükleniyor...</td></tr>
                ) : licenses.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Henüz lisans kaydı yok</td></tr>
                ) : licenses.map(lic => (
                  <tr key={lic.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{lic.customerName}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        {lic.domain && <><Globe className="w-3 h-3" />{lic.domain}</>}
                        {lic.databaseName && <><Database className="w-3 h-3 ml-2" />{lic.databaseName}</>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{lic.licenseKey}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${lic.planType === 'YEARLY' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {lic.planType === 'YEARLY' ? 'Yıllık' : 'Aylık'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{lic.monthlyFee.toLocaleString('tr-TR')} ₺</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(lic.expiryDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge license={lic} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleExtend(lic)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Süre Uzat">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleActive(lic)} className={`p-1.5 rounded-lg ${lic.isActive ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`} title={lic.isActive ? 'Askıya Al' : 'Aktifleştir'}>
                          {lic.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(lic)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Düzenle">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(lic.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
