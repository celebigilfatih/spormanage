'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Users as UsersIcon, Edit2, Trash2, Power, Shield, Eye, EyeOff, MapPin, UsersRound } from 'lucide-react'

interface Branch {
  id: string
  name: string
}

interface GroupOption {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  isActive: boolean
  branchId?: string
  createdAt: string
  branch?: { id: string; name: string } | null
  groupPermissions?: { group: { id: string; name: string } }[]
}

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  
  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'SECRETARY',
    branchId: '',
    groupIds: [] as string[]
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Trainer form data
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchGroups, setBranchGroups] = useState<GroupOption[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)

  // Only ADMIN can access
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard')
      toast({
        variant: 'destructive',
        title: 'Yetkisiz Erişim',
        description: 'Bu sayfaya erişim yetkiniz yok'
      })
    }
  }, [user, router])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers()
      fetchBranches()
    }
  }, [user, searchTerm, roleFilter])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data.filter((b: Branch & { isActive?: boolean }) => b.isActive !== false))
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    }
  }

  const fetchGroupsByBranch = async (branchId: string) => {
    if (!branchId) {
      setBranchGroups([])
      return
    }
    setLoadingGroups(true)
    try {
      const response = await fetch(`/api/groups?branchId=${branchId}`)
      if (response.ok) {
        const data = await response.json()
        setBranchGroups(data.filter((g: GroupOption & { isActive?: boolean }) => g.isActive !== false))
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        role: roleFilter
      })
      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branchId: formData.role === 'TRAINER' ? formData.branchId : undefined,
          groupIds: formData.role === 'TRAINER' ? formData.groupIds : undefined
        })
      })

      if (response.ok) {
        setShowForm(false)
        setEditingUser(null)
        resetForm()
        fetchUsers()
        toast({
          title: '✅ Başarılı!',
          description: editingUser ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu'
        })
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: '❌ Hata!',
          description: error.error || 'İşlem başarısız'
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ Hata!',
        description: 'İşlem sırasında bir hata oluştu'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (editUser: User) => {
    setEditingUser(editUser)
    const baseFormData = {
      email: editUser.email,
      password: '',
      name: editUser.name,
      phone: editUser.phone || '',
      role: editUser.role,
      branchId: editUser.branchId || '',
      groupIds: editUser.groupPermissions?.map(gp => gp.group.id) || []
    }
    setFormData(baseFormData)

    // Grup seçeneklerini yükle (antrenör ise)
    if (editUser.role === 'TRAINER' && editUser.branchId) {
      fetchGroupsByBranch(editUser.branchId)
    }

    // Eğer kullanıcı detayları yoksa API'den çek
    if (editUser.role === 'TRAINER' && !editUser.groupPermissions) {
      try {
        const response = await fetch(`/api/users/${editUser.id}`)
        if (response.ok) {
          const detail = await response.json()
          setFormData(prev => ({
            ...prev,
            branchId: detail.branchId || '',
            groupIds: detail.groupPermissions?.map((gp: any) => gp.group.id) || []
          }))
          if (detail.branchId) {
            fetchGroupsByBranch(detail.branchId)
          }
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error)
      }
    }

    setShowForm(true)
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`${userName} kullanıcısını silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUsers()
        toast({
          title: '✅ Silindi!',
          description: `${userName} başarıyla silindi`
        })
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: '❌ Hata!',
          description: error.error || 'Kullanıcı silinemedi'
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '❌ Hata!',
        description: 'Kullanıcı silinirken bir hata oluştu'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'SECRETARY',
      branchId: '',
      groupIds: []
    })
    setShowPassword(false)
    setBranchGroups([])
  }

  const handleBranchChange = (branchId: string) => {
    setFormData(prev => ({ ...prev, branchId, groupIds: [] }))
    fetchGroupsByBranch(branchId)
  }

  const toggleGroupSelection = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter(id => id !== groupId)
        : [...prev.groupIds, groupId]
    }))
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800',
      TRAINER: 'bg-blue-100 text-blue-800',
      ACCOUNTING: 'bg-green-100 text-green-800',
      SECRETARY: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      ADMIN: 'Admin',
      TRAINER: 'Antrenör',
      ACCOUNTING: 'Muhasebe',
      SECRETARY: 'Sekreter'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    )
  }

  if (user?.role !== 'ADMIN') {
    return null
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Sistem kullanıcılarını ve yetkilerini yönetin
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingUser(null)
                resetForm()
                setShowForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Kullanıcı Ekle
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ara
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Ad veya e-posta ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm roller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm roller</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="TRAINER">Antrenör</SelectItem>
                  <SelectItem value="ACCOUNTING">Muhasebe</SelectItem>
                  <SelectItem value="SECRETARY">Sekreter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-lg text-gray-600">Yükleniyor...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg text-gray-600 mb-2">Kullanıcı bulunamadı</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Şube / Gruplar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'TRAINER' ? (
                          <div className="text-sm">
                            {user.branch && (
                              <div className="flex items-center gap-1 text-gray-700">
                                <MapPin className="h-3 w-3" />
                                {user.branch.name}
                              </div>
                            )}
                            {user.groupPermissions && user.groupPermissions.length > 0 && (
                              <div className="flex items-center gap-1 text-gray-500 mt-1">
                                <UsersRound className="h-3 w-3" />
                                {user.groupPermissions.map(gp => gp.group.name).join(', ')}
                              </div>
                            )}
                            {(!user.groupPermissions || user.groupPermissions.length === 0) && !user.branch && (
                              <span className="text-gray-400 text-xs">Atanmamış</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(user.id, user.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
            </DialogTitle>
            <DialogDescription>
              Kullanıcı bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta *
                </label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ahmet@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre {editingUser && '(Değiştirmek için doldurun)'}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="555 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    setFormData({ ...formData, role: value, branchId: '', groupIds: [] })
                    setBranchGroups([])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TRAINER">Antrenör</SelectItem>
                    <SelectItem value="ACCOUNTING">Muhasebe</SelectItem>
                    <SelectItem value="SECRETARY">Sekreter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Antrenör Şube ve Grup Seçimi */}
            {formData.role === 'TRAINER' && (
              <div className="border-t pt-4 mt-2 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Antrenör Yetkilendirme
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şube *
                  </label>
                  <Select
                    value={formData.branchId || 'placeholder'}
                    onValueChange={(value) => value !== 'placeholder' && handleBranchChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şube seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.length > 0 ? (
                        branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-branches" disabled>
                          Şube bulunamadı
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {formData.branchId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Erişim Verilecek Gruplar
                    </label>
                    {loadingGroups ? (
                      <div className="text-sm text-gray-500 py-2">Gruplar yükleniyor...</div>
                    ) : branchGroups.length === 0 ? (
                      <div className="text-sm text-gray-500 py-2 bg-gray-50 rounded-lg px-3">
                        Bu şubede henüz grup bulunmuyor
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                        {branchGroups.map((group) => (
                          <label
                            key={group.id}
                            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                              formData.groupIds.includes(group.id)
                                ? 'bg-blue-100 border border-blue-300'
                                : 'bg-white border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.groupIds.includes(group.id)}
                              onChange={() => toggleGroupSelection(group.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{group.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {formData.groupIds.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {formData.groupIds.length} grup seçildi
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingUser(null)
                  resetForm()
                }}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor...' : editingUser ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
