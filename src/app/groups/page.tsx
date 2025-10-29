'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2,
  ArrowRight,
  Calendar,
  UserCheck,
  UserX,
  MoreHorizontal
} from 'lucide-react'
import { Group, Student, UserRole } from '@/types'
import { AuthService } from '@/lib/auth'

interface GroupWithStats extends Group {
  students?: Student[]
  _count?: {
    students: number
  }
}

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupWithStats[]>([])
  const [selectedGroup, setSelectedGroup] = useState<GroupWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [transferStudent, setTransferStudent] = useState<Student | null>(null)
  const [editingGroup, setEditingGroup] = useState<GroupWithStats | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  })
  const [transferForm, setTransferForm] = useState({
    newGroupId: '',
    reason: ''
  })

  const canManageGroups = user && AuthService.canManageStudents(user.role as UserRole)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
        if (data.length > 0 && !selectedGroup) {
          setSelectedGroup(data[0])
          fetchGroupDetails(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupDetails = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedGroup(data)
      }
    } catch (error) {
      console.error('Failed to fetch group details:', error)
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupForm.name.trim() || !editingGroup) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
      })

      if (response.ok) {
        setShowEditForm(false)
        setEditingGroup(null)
        setGroupForm({ name: '', description: '' })
        fetchGroups()
        // TODO: Show success toast
      } else {
        const error = await response.json()
        console.error('Group edit failed:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Group edit failed:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGroup = async (group: GroupWithStats) => {
    const hasStudents = group._count?.students && group._count.students > 0
    
    const confirmMessage = hasStudents 
      ? `"${group.name}" grubunda ${group._count?.students} öğrenci var. Bu grubu silmek istediğinizden emin misiniz? Öğrenciler gruptan çıkarılacak.`
      : `"${group.name}" grubunu silmek istediğinizden emin misiniz?`
    
    if (!confirm(confirmMessage)) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGroups()
        if (selectedGroup?.id === group.id) {
          setSelectedGroup(null)
        }
        // TODO: Show success toast
      } else {
        const error = await response.json()
        console.error('Group deletion failed:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Group deletion failed:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferStudent || !transferForm.newGroupId) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/groups/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: transferStudent.id,
          newGroupId: transferForm.newGroupId,
          reason: transferForm.reason
        }),
      })

      if (response.ok) {
        setShowTransferForm(false)
        setTransferStudent(null)
        setTransferForm({ newGroupId: '', reason: '' })
        fetchGroups()
        if (selectedGroup) {
          fetchGroupDetails(selectedGroup.id)
        }
        // TODO: Show success toast
      } else {
        const error = await response.json()
        console.error('Student transfer failed:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Student transfer failed:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditForm = (group: GroupWithStats) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description || ''
    })
    setShowEditForm(true)
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupForm.name.trim()) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setGroupForm({ name: '', description: '' })
        fetchGroups()
        // TODO: Show success toast
      } else {
        const error = await response.json()
        console.error('Group creation failed:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Group creation failed:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Gruplar yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gruplar</h1>
              <p className="text-gray-600">
                Antrenman grupları ve öğrenci atamalarını yönet
              </p>
            </div>
            {canManageGroups && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Grup Oluştur
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Yeni Grup Oluştur</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <Label htmlFor="name">Grup Adı *</Label>
                <Input
                  id="name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="örn., U15, İleri Seviye, Başlangıç"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Grup hakkında kısa açıklama"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Oluşturuluyor...' : 'Grup Oluştur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Form Modal */}
      {showEditForm && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Grup Düzenle</h3>
            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <Label htmlFor="editName">Grup Adı *</Label>
                <Input
                  id="editName"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="örn., U15, İleri Seviye, Başlangıç"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Açıklama</Label>
                <Input
                  id="editDescription"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Grup hakkında kısa açıklama"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingGroup(null)
                    setGroupForm({ name: '', description: '' })
                  }}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Güncelleniyor...' : 'Grubu Güncelle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showTransferForm && transferStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {transferStudent.firstName} {transferStudent.lastName} Transferi
            </h3>
            <form onSubmit={handleTransferStudent} className="space-y-4">
              <div>
                <Label htmlFor="newGroupId">Yeni Grup *</Label>
                <Select
                  value={transferForm.newGroupId}
                  onValueChange={(value) => setTransferForm({ ...transferForm, newGroupId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Yeni grup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups
                      .filter(g => g.id !== transferStudent.groupId && g.isActive)
                      .map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} - {group._count?.students || 0} öğrenci
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Transfer Nedeni</Label>
                <Input
                  id="reason"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="Transfer için isteğe bağlı neden"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTransferForm(false)
                    setTransferStudent(null)
                  }}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Transfer ediliyor...' : 'Öğrenciyi Transfer Et'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Groups List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tüm Gruplar</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedGroup?.id === group.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedGroup(group)
                      fetchGroupDetails(group.id)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-600">{group.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {group._count?.students || 0}
                        </div>
                        <div className="text-xs text-gray-500">öğrenci</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        group.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {group.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      
                      {canManageGroups && (
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditForm(group)
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteGroup(group)
                            }}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Group Details */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <div className="space-y-6">
                {/* Group Header */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
                      {selectedGroup.description && (
                        <p className="text-gray-600 mt-1">{selectedGroup.description}</p>
                      )}
                    </div>
                    {canManageGroups && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditForm(selectedGroup)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Grubu Düzenle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteGroup(selectedGroup)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Grubu Sil
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedGroup.students?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Toplam Öğrenci</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedGroup.students?.filter(s => s.isActive).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Aktif Öğrenci</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {selectedGroup.feeTypes?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Ücret Türleri</div>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Öğrenciler</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {selectedGroup.students?.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-gray-600">Bu grupta öğrenci yok</div>
                      </div>
                    ) : (
                      selectedGroup.students?.map((student) => (
                        <div key={student.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </h4>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  student.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {student.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              
                              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Kayıt: {new Date(student.enrollmentDate).toLocaleDateString('tr-TR')}
                                </div>
                                {student.phone && (
                                  <div>{student.phone}</div>
                                )}
                              </div>

                              {student.parents && student.parents.length > 0 && (
                                <div className="mt-1 text-sm text-gray-600">
                                  Ana iletişim: {student.parents[0].firstName} {student.parents[0].lastName} - {student.parents[0].phone}
                                </div>
                              )}

                              {student._count && (
                                <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                                  <span>Ödemeler: {student._count.payments}</span>
                                  <span>Notlar: {student._count.notes}</span>
                                  <span>Devam: {student._count.attendances}</span>
                                </div>
                              )}
                            </div>

                            {canManageGroups && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTransferStudent(student)
                                  setShowTransferForm(true)
                                }}
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Transfer
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-600">Detayları görmek için bir grup seçin</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}