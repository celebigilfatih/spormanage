'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Users, 
  UsersRound,
  Edit, 
  Trash2,
  ArrowRight,
  Calendar,
  UserCheck,
  UserX,
  MoreHorizontal,
  X,
  MapPin,
  Clock,
  Layout,
  Award,
  BookOpen
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
  const [trainers, setTrainers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [fields, setFields] = useState<any[]>([])
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
    description: '',
    coachId: '',
    assistantCoachId: '',
    branchId: '',
    trainingDays: [] as string[],
    trainingStartTime: '',
    trainingEndTime: '',
    trainingType: '',
    fieldId: ''
  })
  const [transferForm, setTransferForm] = useState({
    newGroupId: '',
    reason: ''
  })

  const canManageGroups = user && AuthService.canManageStudents(user.role as UserRole)

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: '',
      coachId: '',
      assistantCoachId: '',
      branchId: '',
      trainingDays: [],
      trainingStartTime: '',
      trainingEndTime: '',
      trainingType: '',
      fieldId: ''
    })
  }

  useEffect(() => {
    fetchGroups()
    fetchTrainers()
    fetchBranches()
    fetchFields()
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

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data)
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    }
  }

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/fields?isActive=true')
      if (response.ok) {
        const data = await response.json()
        setFields(data)
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error)
    }
  }

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/trainers')
      if (response.ok) {
        const data = await response.json()
        setTrainers(data)
      }
    } catch (error) {
      console.error('Failed to fetch trainers:', error)
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
    if (!groupForm.branchId) {
      alert('Lütfen bir şube seçin.')
      return
    }

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
        resetGroupForm()
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
      description: group.description || '',
      coachId: (group as any).coachId || '',
      assistantCoachId: (group as any).assistantCoachId || '',
      branchId: (group as any).branchId || '',
      trainingDays: (group as any).trainingDays || [],
      trainingStartTime: (group as any).trainingStartTime || '',
      trainingEndTime: (group as any).trainingEndTime || '',
      trainingType: (group as any).trainingType || '',
      fieldId: (group as any).fieldId || ''
    })
    setShowEditForm(true)
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupForm.name.trim()) return
    if (!groupForm.branchId) {
      alert('Lütfen bir şube seçin.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
      })

      if (response.ok) {
        setShowCreateForm(false)
        resetGroupForm()
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
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Gruplar yükleniyor...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="w-full px-4 sm:px-6 lg:px-8">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Yeni Grup Oluştur</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* LEFT COLUMN: Basic Info */}
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      Grup Temel Bilgileri
                    </h4>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="branch" className="text-sm font-bold text-gray-700 mb-1.5 block">ŞUBE *</Label>
                          <Select
                            value={groupForm.branchId || ''}
                            onValueChange={(value) => setGroupForm({ ...groupForm, branchId: value })}
                          >
                            <SelectTrigger className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg">
                              <SelectValue placeholder="Şube seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {branches && branches.length > 0 ? (
                                branches.filter(b => b.isActive).map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading" disabled>
                                  Şube yükleniyor...
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="name" className="text-sm font-bold text-gray-700 mb-1.5 block">GRUP ADI *</Label>
                          <Input
                            id="name"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            placeholder="örn., U15"
                            required
                            className="h-12 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description" className="text-sm font-bold text-gray-700 mb-1.5 block">AÇIKLAMA</Label>
                        <Textarea
                          id="description"
                          value={groupForm.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGroupForm({ ...groupForm, description: e.target.value })}
                          placeholder="Grup hakkında kısa açıklama..."
                          className="min-h-[150px] border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg py-3"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Training Info */}
                <div className="space-y-8 bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                  <div>
                    <h4 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      Antrenman Bilgileri
                    </h4>
                    
                    <div className="space-y-6">
                      {/* Coaches Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="coachId" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">ANTRENÖR</Label>
                          <Select
                            value={groupForm.coachId}
                            onValueChange={(value) => setGroupForm({ ...groupForm, coachId: value })}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Antrenör seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {trainers && trainers.filter(t => t.isActive).length > 0 ? (
                                trainers.filter(t => t.isActive).map((trainer) => (
                                  <SelectItem key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-trainers" disabled>
                                  Antrenör bulunamadı
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="assistantCoachId" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">YARDIMCI ANTRENÖR</Label>
                          <Select
                            value={groupForm.assistantCoachId}
                            onValueChange={(value) => setGroupForm({ ...groupForm, assistantCoachId: value })}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Seçin (Opsiyonel)" />
                            </SelectTrigger>
                            <SelectContent>
                              {trainers && trainers.filter(t => t.isActive && t.id !== groupForm.coachId).length > 0 ? (
                                trainers.filter(t => t.isActive && t.id !== groupForm.coachId).map((trainer) => (
                                  <SelectItem key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-assistants" disabled>
                                  {groupForm.coachId ? 'Başka antrenör yok' : 'Önce antrenör seçin'}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Days Grid */}
                      <div>
                        <Label className="text-sm font-bold text-gray-700 mb-3 block text-xs uppercase">ANTRENMAN GÜNLERİ</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'Monday', label: 'Pzt' },
                            { id: 'Tuesday', label: 'Sal' },
                            { id: 'Wednesday', label: 'Çar' },
                            { id: 'Thursday', label: 'Per' },
                            { id: 'Friday', label: 'Cum' },
                            { id: 'Saturday', label: 'Cmt' },
                            { id: 'Sunday', label: 'Paz' }
                          ].map(day => (
                            <label key={day.id} className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all ${
                              groupForm.trainingDays.includes(day.id) 
                                ? 'bg-blue-600 border-blue-600 text-white font-bold' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={groupForm.trainingDays.includes(day.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupForm({ ...groupForm, trainingDays: [...groupForm.trainingDays, day.id] })
                                  } else {
                                    setGroupForm({ ...groupForm, trainingDays: groupForm.trainingDays.filter(d => d !== day.id) })
                                  }
                                }}
                              />
                              <span className="text-xs uppercase">{day.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Times Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="trainingStartTime" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">BAŞLANGIÇ SAATİ</Label>
                          <Input
                            id="trainingStartTime"
                            type="time"
                            value={groupForm.trainingStartTime}
                            onChange={(e) => setGroupForm({ ...groupForm, trainingStartTime: e.target.value })}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="trainingEndTime" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">BİTİŞ SAATİ</Label>
                          <Input
                            id="trainingEndTime"
                            type="time"
                            value={groupForm.trainingEndTime}
                            onChange={(e) => setGroupForm({ ...groupForm, trainingEndTime: e.target.value })}
                            className="bg-white"
                          />
                        </div>
                      </div>

                      {/* Field Row */}
                      <div>
                        <Label htmlFor="fieldId" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">SAHA SEÇİMİ</Label>
                        <Select
                          value={groupForm.fieldId}
                          onValueChange={(value) => setGroupForm({ ...groupForm, fieldId: value })}
                        >
                          <SelectTrigger className="bg-white border-blue-200 font-bold text-blue-700 ring-2 ring-blue-50">
                            <SelectValue placeholder="Saha seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">Hızlı Seçim</div>
                            {['Saha 1', 'Saha 2', 'Saha 3', 'Saha 4'].map(s => (
                              <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                            ))}
                            {fields.length > 0 && (
                              <>
                                <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-t mt-1">Tanımlı Sahalar</div>
                                {fields.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-8 border-t mt-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isSubmitting}
                  className="h-12 px-8 font-semibold text-gray-600"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 bg-blue-600 hover:bg-blue-700 px-12 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  {isSubmitting ? 'Oluşturuluyor...' : 'Grubu Kaydet ve Oluştur'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Form Modal */}
      {showEditForm && editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Grup Düzenle: {editingGroup.name}</h3>
              <button onClick={() => { setShowEditForm(false); setEditingGroup(null); resetGroupForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditGroup} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* LEFT COLUMN: Basic Info */}
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      Grup Temel Bilgileri
                    </h4>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editBranch" className="text-sm font-bold text-gray-700 mb-1.5 block">ŞUBE *</Label>
                          <Select
                            value={groupForm.branchId || ''}
                            onValueChange={(value) => setGroupForm({ ...groupForm, branchId: value })}
                          >
                            <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                              <SelectValue placeholder="Şube seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {branches && branches.length > 0 ? (
                                branches.filter(b => b.isActive).map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="loading-edit" disabled>
                                  Şube yükleniyor...
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="editName" className="text-sm font-bold text-gray-700 mb-1.5 block">GRUP ADI *</Label>
                          <Input
                            id="editName"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            placeholder="örn., U15"
                            required
                            className="h-12 border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="editDescription" className="text-sm font-bold text-gray-700 mb-1.5 block">AÇIKLAMA</Label>
                        <Textarea
                          id="editDescription"
                          value={groupForm.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGroupForm({ ...groupForm, description: e.target.value })}
                          placeholder="Grup hakkında kısa açıklama..."
                          className="min-h-[150px] border-gray-300 rounded-lg py-3"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Training Info */}
                <div className="space-y-8 bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                  <div>
                    <h4 className="text-lg font-bold text-blue-800 mb-6 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      Antrenman Bilgileri
                    </h4>
                    
                    <div className="space-y-6">
                      {/* Coaches Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editCoachId" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">ANTRENÖR</Label>
                          <Select
                            value={groupForm.coachId}
                            onValueChange={(value) => setGroupForm({ ...groupForm, coachId: value })}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Antrenör seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {trainers && trainers.filter(t => t.isActive).length > 0 ? (
                                trainers.filter(t => t.isActive).map((trainer) => (
                                  <SelectItem key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-trainers-edit" disabled>
                                  Antrenör bulunamadı
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="editAssistantCoachId" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">YARDIMCI ANTRENÖR</Label>
                          <Select
                            value={groupForm.assistantCoachId}
                            onValueChange={(value) => setGroupForm({ ...groupForm, assistantCoachId: value })}
                          >
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Seçin (Opsiyonel)" />
                            </SelectTrigger>
                            <SelectContent>
                              {trainers && trainers.filter(t => t.isActive && t.id !== groupForm.coachId).length > 0 ? (
                                trainers.filter(t => t.isActive && t.id !== groupForm.coachId).map((trainer) => (
                                  <SelectItem key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-assistants-edit" disabled>
                                  {groupForm.coachId ? 'Başka antrenör yok' : 'Önce antrenör seçin'}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Days Grid */}
                      <div>
                        <Label className="text-sm font-bold text-gray-700 mb-3 block text-xs uppercase">ANTRENMAN GÜNLERİ</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'Monday', label: 'Pzt' },
                            { id: 'Tuesday', label: 'Sal' },
                            { id: 'Wednesday', label: 'Çar' },
                            { id: 'Thursday', label: 'Per' },
                            { id: 'Friday', label: 'Cum' },
                            { id: 'Saturday', label: 'Cmt' },
                            { id: 'Sunday', label: 'Paz' }
                          ].map(day => (
                            <label key={day.id} className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all ${
                              groupForm.trainingDays.includes(day.id) 
                                ? 'bg-blue-600 border-blue-600 text-white font-bold' 
                                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={groupForm.trainingDays.includes(day.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setGroupForm({ ...groupForm, trainingDays: [...groupForm.trainingDays, day.id] })
                                  } else {
                                    setGroupForm({ ...groupForm, trainingDays: groupForm.trainingDays.filter(d => d !== day.id) })
                                  }
                                }}
                              />
                              <span className="text-xs uppercase">{day.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Times Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editTrainingStartTime" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">BAŞLANGIÇ SAATİ</Label>
                          <Input
                            id="editTrainingStartTime"
                            type="time"
                            value={groupForm.trainingStartTime}
                            onChange={(e) => setGroupForm({ ...groupForm, trainingStartTime: e.target.value })}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="editTrainingEndTime" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">BİTİŞ SAATİ</Label>
                          <Input
                            id="editTrainingEndTime"
                            type="time"
                            value={groupForm.trainingEndTime}
                            onChange={(e) => setGroupForm({ ...groupForm, trainingEndTime: e.target.value })}
                            className="bg-white"
                          />
                        </div>
                      </div>

                      {/* Field Row */}
                      <div>
                        <Label htmlFor="editFieldId" className="text-sm font-bold text-gray-700 mb-1.5 block text-xs">SAHA SEÇİMİ</Label>
                        <Select
                          value={groupForm.fieldId}
                          onValueChange={(value) => setGroupForm({ ...groupForm, fieldId: value })}
                        >
                          <SelectTrigger className="bg-white border-blue-200 font-bold text-blue-700 ring-2 ring-blue-50 text-xs">
                            <SelectValue placeholder="Saha seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">Hızlı Seçim</div>
                            {['Saha 1', 'Saha 2', 'Saha 3', 'Saha 4'].map(s => (
                              <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                            ))}
                            {fields.length > 0 && (
                              <>
                                <div className="p-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-t mt-1">Tanımlı Sahalar</div>
                                {fields.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-8 border-t mt-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowEditForm(false); setEditingGroup(null); resetGroupForm(); }}
                  disabled={isSubmitting}
                  className="h-12 px-8 font-semibold text-gray-600"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 bg-blue-600 hover:bg-blue-700 px-12 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
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

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
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
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      selectedGroup?.id === group.id 
                        ? 'bg-blue-50 border-blue-600 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-gray-50 border-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedGroup(group)
                      fetchGroupDetails(group.id)
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold truncate ${selectedGroup?.id === group.id ? 'text-blue-700' : 'text-gray-900'}`}>
                            {group.name}
                          </h3>
                          {group.isActive ? (
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          ) : (
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{group.description}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-sm font-black ${selectedGroup?.id === group.id ? 'text-blue-600' : 'text-gray-700'}`}>
                          {group._count?.students || 0}
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Öğrenci</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {(group as any).trainingDays?.slice(0, 3).map((day: string) => (
                          <span key={day} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-[4px] text-[9px] font-bold uppercase">
                            {day === 'Monday' ? 'Pzt' : day === 'Tuesday' ? 'Sal' : day === 'Wednesday' ? 'Çar' : day === 'Thursday' ? 'Per' : day === 'Friday' ? 'Cum' : day === 'Saturday' ? 'Cmt' : 'Paz'}
                          </span>
                        ))}
                        {(group as any).trainingDays?.length > 3 && (
                          <span className="text-[9px] font-bold text-gray-400">...</span>
                        )}
                      </div>
                      
                      {canManageGroups && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditForm(group)
                            }}
                            className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit className="h-3.5 w-3.5" />
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
                <div className="bg-white rounded-xl shadow-md border border-blue-50 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <UsersRound className="h-6 w-6 text-white" />
                          </div>
                          <h2 className="text-3xl font-extrabold tracking-tight">{selectedGroup.name}</h2>
                        </div>
                        {selectedGroup.description && (
                          <p className="text-blue-100 mt-2 font-medium opacity-90 max-w-2xl">{selectedGroup.description}</p>
                        )}
                      </div>
                      
                      {canManageGroups && (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => openEditForm(selectedGroup)}
                            className="bg-white text-blue-700 hover:bg-blue-50 border-none font-bold"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteGroup(selectedGroup)}
                            className="bg-red-500/90 hover:bg-red-600 text-white border-none font-bold"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {/* Left: Location & Technical */}
                      <div className="space-y-4">
                        {(selectedGroup as any).branch && (
                          <div className="flex items-start gap-3 group">
                            <div className="mt-1 bg-blue-50 p-2 rounded-md group-hover:bg-blue-100 transition-colors">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Şube</p>
                              <p className="font-bold text-gray-900">{(selectedGroup as any).branch.name}</p>
                            </div>
                          </div>
                        )}
                        
                        {(selectedGroup as any).coach && (
                          <div className="flex items-start gap-3 group">
                            <div className="mt-1 bg-indigo-50 p-2 rounded-md group-hover:bg-indigo-100 transition-colors">
                              <UserCheck className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Baş Antrenör</p>
                              <p className="font-bold text-gray-900">{(selectedGroup as any).coach.name}</p>
                              <p className="text-xs text-gray-500 font-medium">{(selectedGroup as any).coach.position}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Middle: Schedule */}
                      <div className="space-y-4">
                        {(selectedGroup as any).trainingDays && (selectedGroup as any).trainingDays.length > 0 && (
                          <div className="flex items-start gap-3 group">
                            <div className="mt-1 bg-emerald-50 p-2 rounded-md group-hover:bg-emerald-100 transition-colors">
                              <Calendar className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Antrenman Programı</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(selectedGroup as any).trainingDays.map((day: string) => (
                                  <span key={day} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black border border-emerald-100 uppercase">
                                    {day === 'Monday' ? 'Pzt' : day === 'Tuesday' ? 'Sal' : day === 'Wednesday' ? 'Çar' : day === 'Thursday' ? 'Per' : day === 'Friday' ? 'Cum' : day === 'Saturday' ? 'Cmt' : 'Paz'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {((selectedGroup as any).trainingStartTime || (selectedGroup as any).trainingEndTime) && (
                          <div className="flex items-start gap-3 group">
                            <div className="mt-1 bg-amber-50 p-2 rounded-md group-hover:bg-amber-100 transition-colors">
                              <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saat Aralığı</p>
                              <p className="font-bold text-gray-900 tracking-tight">
                                {(selectedGroup as any).trainingStartTime || '--:--'} - {(selectedGroup as any).trainingEndTime || '--:--'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Field & Assistant */}
                      <div className="space-y-4">
                        {(selectedGroup as any).fieldId && (
                          <div className="flex items-start gap-3 group">
                            <div className="mt-1 bg-purple-50 p-2 rounded-md group-hover:bg-purple-100 transition-colors">
                              <Layout className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Antrenman Sahası</p>
                              <p className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-block mt-0.5">
                                {(selectedGroup as any).fieldId}
                              </p>
                            </div>
                          </div>
                        )}

                        {(selectedGroup as any).assistantCoach && (
                          <div className="flex items-start gap-3 group">
                            <div className="mt-1 bg-cyan-50 p-2 rounded-md group-hover:bg-cyan-100 transition-colors">
                              <Award className="h-4 w-4 text-cyan-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Yardımcı Antrenör</p>
                              <p className="font-bold text-gray-900">{(selectedGroup as any).assistantCoach.name}</p>
                              <p className="text-xs text-gray-500">{(selectedGroup as any).assistantCoach.position}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 group hover:bg-blue-50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                            <UsersRound className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Kadro</span>
                        </div>
                        <div className="text-3xl font-black text-blue-700">
                          {selectedGroup.students?.length || 0}
                        </div>
                        <div className="text-xs font-bold text-blue-600/70 mt-1 uppercase">Toplam Öğrenci</div>
                      </div>

                      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 group hover:bg-emerald-50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-emerald-100 rounded-lg group-hover:scale-110 transition-transform">
                            <UserCheck className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Durum</span>
                        </div>
                        <div className="text-3xl font-black text-emerald-700">
                          {selectedGroup.students?.filter(s => s.isActive).length || 0}
                        </div>
                        <div className="text-xs font-bold text-emerald-600/70 mt-1 uppercase">Aktif Öğrenci</div>
                      </div>

                      <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 group hover:bg-amber-50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform">
                            <BookOpen className="h-5 w-5 text-amber-600" />
                          </div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Finans</span>
                        </div>
                        <div className="text-3xl font-black text-amber-700">
                          {selectedGroup.feeTypes?.length || 0}
                        </div>
                        <div className="text-xs font-bold text-amber-600/70 mt-1 uppercase">Ücret Türleri</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Öğrenci Listesi
                    </h3>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {selectedGroup.students?.length || 0} KAYITLI
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedGroup.students?.length === 0 ? (
                      <div className="p-12 text-center">
                        <UsersRound className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                        <div className="text-gray-400 font-medium italic">Bu grupta henüz öğrenci bulunmuyor.</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 divide-y divide-gray-100">
                        {selectedGroup.students?.map((student) => (
                          <div key={student.id} className="p-5 hover:bg-blue-50/30 transition-colors group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                  <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {student.firstName} {student.lastName}
                                  </h4>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                    student.isActive 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {student.isActive ? 'Aktif' : 'Pasif'}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                    <span className="font-medium">Kayıt:</span>
                                    <span className="ml-1 font-semibold text-gray-700">{new Date(student.enrollmentDate).toLocaleDateString('tr-TR')}</span>
                                  </div>
                                  {student.phone && (
                                    <div className="flex items-center text-sm text-gray-500">
                                      <div className="h-3.5 w-3.5 mr-2 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                      </div>
                                      <span className="font-semibold text-gray-700">{student.phone}</span>
                                    </div>
                                  )}
                                  {student.parents && student.parents.length > 0 && (
                                    <div className="md:col-span-2 flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mt-1 border border-gray-100">
                                      <Users className="h-3 w-3 mr-2 text-indigo-400" />
                                      <span className="font-bold uppercase text-[9px] text-gray-400 mr-2">Veli:</span>
                                      <span className="font-bold text-gray-700">{student.parents[0].firstName} {student.parents[0].lastName}</span>
                                      <span className="mx-2 text-gray-300">|</span>
                                      <span className="font-medium text-blue-600">{student.parents[0].phone}</span>
                                    </div>
                                  )}
                                </div>

                                {student._count && (
                                  <div className="mt-3 flex flex-wrap gap-3">
                                    <div className="px-2 py-1 bg-white border border-gray-100 rounded shadow-sm text-[10px] font-bold text-gray-500 flex items-center">
                                      <div className="w-1 h-1 bg-amber-400 rounded-full mr-1.5"></div>
                                      Ödemeler: {student._count.payments}
                                    </div>
                                    <div className="px-2 py-1 bg-white border border-gray-100 rounded shadow-sm text-[10px] font-bold text-gray-500 flex items-center">
                                      <div className="w-1 h-1 bg-blue-400 rounded-full mr-1.5"></div>
                                      Notlar: {student._count.notes}
                                    </div>
                                    <div className="px-2 py-1 bg-white border border-gray-100 rounded shadow-sm text-[10px] font-bold text-gray-500 flex items-center">
                                      <div className="w-1 h-1 bg-emerald-400 rounded-full mr-1.5"></div>
                                      Devam: {student._count.attendances}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {canManageGroups && (
                                <div className="flex sm:flex-col justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setTransferStudent(student)
                                      setShowTransferForm(true)
                                    }}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-bold h-9 group-hover:shadow-md transition-all"
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Transfer
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
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
    </AppLayout>
  )
}