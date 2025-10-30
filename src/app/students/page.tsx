'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/AppLayout'
import { StudentRegistrationForm } from '@/components/forms/StudentRegistrationForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Search, Users, Phone, Mail, Calendar, MapPin, Eye, Edit2, Trash2, Power } from 'lucide-react'
import { Student, Group, StudentFormData, UserRole } from '@/types'
import { AuthService } from '@/lib/auth'

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active') // Default to active students only
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudents, setTotalStudents] = useState(0)

  const canManageStudents = user && AuthService.canManageStudents(user.role as UserRole)

  useEffect(() => {
    fetchStudents()
    fetchGroups()
  }, [currentPage, searchTerm, selectedGroup, statusFilter])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        groupId: selectedGroup,
        status: statusFilter,
      })

      const response = await fetch(`/api/students?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
        setTotalPages(data.pagination.pages)
        setTotalStudents(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    }
  }

  const handleStudentRegistration = async (data: StudentFormData) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setShowRegistrationForm(false)
        fetchStudents() // Refresh the list
        // TODO: Show success toast
      } else {
        const error = await response.json()
        // TODO: Show error toast
        console.error('Registration failed:', error.error)
      }
    } catch (error) {
      console.error('Registration failed:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStudentEdit = async (data: StudentFormData) => {
    if (!selectedStudent) return
    
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setShowEditModal(false)
        setSelectedStudent(null)
        fetchStudents() // Refresh the list
        // TODO: Show success toast
        alert('Öğrenci başarıyla güncellendi!')
      } else {
        const error = await response.json()
        // TODO: Show error toast
        console.error('Edit failed:', error.error)
        alert('Güncelleme başarısız: ' + (error.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Edit failed:', error)
      // TODO: Show error toast
      alert('Güncelleme başarısız oldu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`${student.firstName} ${student.lastName} adlı öğrenciyi silmek istediğinizden emin misiniz? Bu işlem öğrenciyi pasif duruma getirecektir.`)) {
      return
    }

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchStudents()
        alert('Öğrenci başarıyla silindi!')
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Öğrenci silinemedi'))
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Öğrenci silinirken bir hata oluştu')
    }
  }

  const handleToggleStatus = async (student: Student) => {
    const action = student.isActive ? 'pasife' : 'aktife'
    if (!confirm(`${student.firstName} ${student.lastName} adlı öğrenciyi ${action} çekmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phone,
          birthDate: student.birthDate,
          groupId: student.group?.id,
          isActive: !student.isActive,
          parents: [] // Empty array, API will skip parent updates if empty
        }),
      })

      if (response.ok) {
        await fetchStudents()
        alert(`Öğrenci başarıyla ${action} çekildi!`)
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Durum güncellenemedi'))
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      alert('Durum güncellenirken bir hata oluştu')
    }
  }

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setShowDetailModal(true)
  }

  const handleEditStudent = async (student: Student) => {
    // Fetch complete student data including all parent fields
    try {
      const response = await fetch(`/api/students/${student.id}`)
      if (response.ok) {
        const fullStudent = await response.json()
        setSelectedStudent(fullStudent)
        setShowEditModal(true)
      } else {
        alert('Öğrenci bilgileri yüklenemedi')
      }
    } catch (error) {
      console.error('Failed to fetch student details:', error)
      alert('Öğrenci bilgileri yüklenirken hata oluştu')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchStudents()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedGroup('all')
    setStatusFilter('active') // Reset to active students
    setCurrentPage(1)
  }

  if (showRegistrationForm || showEditModal) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StudentRegistrationForm
            onSubmit={showEditModal ? handleStudentEdit : handleStudentRegistration}
            onCancel={() => {
              setShowRegistrationForm(false)
              setShowEditModal(false)
              setSelectedStudent(null)
            }}
            isLoading={isSubmitting}
            initialData={showEditModal ? selectedStudent : null}
            mode={showEditModal ? 'edit' : 'create'}
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Öğrenciler</h1>
              <p className="text-gray-600">
                Öğrenci kayıtlarını ve bilgilerini yönetin
              </p>
            </div>
            {canManageStudents && (
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Öğrenci Ekle
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arama
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Öğrenci veya veli ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grup
              </label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm gruplar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm gruplar</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Button type="submit" className="flex-1">
                Ara
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                Sıfırla
              </Button>
            </div>
          </form>
        </div>

        {/* Results Summary */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">
                  Toplam: {totalStudents} öğrenci
                </span>
              </div>
            </div>
            
            {/* Pagination Info */}
            <div className="text-sm text-gray-600">
              Sayfa {currentPage} / {totalPages}
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-lg text-gray-600">Öğrenciler yükleniyor...</div>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg text-gray-600 mb-2">Öğrenci bulunamadı</div>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedGroup || statusFilter !== 'all'
                  ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                  : 'İlk öğrencinizi ekleyerek başlayın'}
              </p>
              {canManageStudents && (
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Öğrenciyi Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öğrenci
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grup
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İletişim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veli
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İstatistikler
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const primaryParent = student.parents?.find(p => p.isPrimary) || student.parents?.[0]
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        {/* Student Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                              {student.phone && (
                                <div className="text-sm text-gray-500">
                                  <Phone className="inline h-3 w-3 mr-1" />
                                  {student.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Group */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.group ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {student.group.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>

                        {/* Contact Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.birthDate && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(student.birthDate).toLocaleDateString('tr-TR')}
                              </div>
                            )}
                            <div className="flex items-center text-gray-500">
                              Kayıt: {new Date(student.enrollmentDate).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </td>

                        {/* Parent Info */}
                        <td className="px-6 py-4">
                          {primaryParent ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {primaryParent.firstName} {primaryParent.lastName}
                              </div>
                              <div className="text-gray-500">
                                <Phone className="inline h-3 w-3 mr-1" />
                                {primaryParent.phone}
                              </div>
                              {primaryParent.email && (
                                <div className="text-gray-500">
                                  <Mail className="inline h-3 w-3 mr-1" />
                                  {primaryParent.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>

                        {/* Statistics */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student._count && (
                            <div className="text-sm text-gray-600">
                              <div>Ödeme: {student._count.payments}</div>
                              <div>Not: {student._count.notes}</div>
                              <div>Devam: {student._count.attendances}</div>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(student)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManageStudents && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditStudent(student)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleToggleStatus(student)}
                                  className={student.isActive 
                                    ? "text-orange-600 hover:text-orange-700 hover:border-orange-300" 
                                    : "text-green-600 hover:text-green-700 hover:border-green-300"
                                  }
                                  title={student.isActive ? 'Pasife Çek' : 'Aktife Çek'}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteStudent(student)}
                                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                                  title="Sil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                
                <div className="flex space-x-2">
                  {(() => {
                    const pages = []
                    const maxPages = Math.min(5, totalPages)
                    
                    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
                    let endPage = Math.min(totalPages, startPage + maxPages - 1)
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxPages) {
                      startPage = Math.max(1, endPage - maxPages + 1)
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                        >
                          {i}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent?.firstName} {selectedStudent?.lastName} - Detaylar
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Öğrenci Bilgileri</h3>
                  <div className="space-y-2">
                    <div><span className="font-medium">Ad Soyad:</span> {selectedStudent.firstName} {selectedStudent.lastName}</div>
                    {selectedStudent.phone && <div><span className="font-medium">Telefon:</span> {selectedStudent.phone}</div>}
                    {selectedStudent.birthDate && (
                      <div><span className="font-medium">Doğum Tarihi:</span> {new Date(selectedStudent.birthDate).toLocaleDateString('tr-TR')}</div>
                    )}
                    <div><span className="font-medium">Kayıt Tarihi:</span> {new Date(selectedStudent.enrollmentDate).toLocaleDateString('tr-TR')}</div>
                    <div><span className="font-medium">Durum:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedStudent.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedStudent.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    {selectedStudent.group && (
                      <div><span className="font-medium">Grup:</span> {selectedStudent.group.name}</div>
                    )}
                  </div>
                </div>

                {/* Parent Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Veli Bilgileri</h3>
                  {selectedStudent.parents && selectedStudent.parents.length > 0 ? (
                    <div className="space-y-4">
                      {selectedStudent.parents.map((parent, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">{parent.firstName} {parent.lastName}</span>
                            {parent.isPrimary && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Ana İletişim</span>
                            )}
                            {parent.isEmergency && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Acil Durum</span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Yakınlık: {parent.relationship}</div>
                            <div>Telefon: {parent.phone}</div>
                            {parent.email && <div>E-posta: {parent.email}</div>}
                            {parent.address && <div>Adres: {parent.address}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">Veli bilgisi bulunamadı</div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              {selectedStudent._count && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedStudent._count.payments}</div>
                      <div className="text-sm text-gray-600">Ödemeler</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedStudent._count.notes}</div>
                      <div className="text-sm text-gray-600">Notlar</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{selectedStudent._count.attendances}</div>
                      <div className="text-sm text-gray-600">Devam</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Edit Modal - Removed, now using form */}
    </AppLayout>
  )
}