'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { StudentRegistrationForm } from '@/components/forms/StudentRegistrationForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Users, Phone, Mail, Calendar, MapPin } from 'lucide-react'
import { Student, Group, StudentFormData, UserRole } from '@/types'
import { AuthService } from '@/lib/auth'

export default function StudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchStudents()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedGroup('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  if (showRegistrationForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StudentRegistrationForm
            onSubmit={handleStudentRegistration}
            onCancel={() => setShowRegistrationForm(false)}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

        {/* Students List */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-lg text-gray-600">Öğrenciler yüklenriyor...</div>
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
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div key={student.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                        {student.group && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.group.name}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Student Info */}
                        <div className="space-y-1">
                          {student.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {student.phone}
                            </div>
                          )}
                          {student.birthDate && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(student.birthDate).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            Kayıt: {new Date(student.enrollmentDate).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Primary Parent Info */}
                        {student.parents && student.parents.length > 0 && (
                          <div className="space-y-1">
                            {(() => {
                              const primaryParent = student.parents.find(p => p.isPrimary) || student.parents[0]
                              return (
                                <>
                                  <div className="text-sm font-medium text-gray-900">
                                    Ana İletişim: {primaryParent.firstName} {primaryParent.lastName}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="h-4 w-4 mr-2" />
                                    {primaryParent.phone}
                                  </div>
                                  {primaryParent.email && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Mail className="h-4 w-4 mr-2" />
                                      {primaryParent.email}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-600">
                                    Yakınlık: {primaryParent.relationship}
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Summary Stats */}
                      {student._count && (
                        <div className="mt-4 flex space-x-6 text-sm text-gray-600">
                          <span>Ödemeler: {student._count.payments}</span>
                          <span>Notlar: {student._count.notes}</span>
                          <span>Devamım: {student._count.attendances}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Detayları Gör
                      </Button>
                      {canManageStudents && (
                        <Button variant="outline" size="sm">
                          Düzenle
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i))
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
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
    </div>
  )
}