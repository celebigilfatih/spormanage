'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/AppLayout'
import { NoteForm } from '@/components/notes/NoteForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  StickyNote, 
  Pin, 
  AlertTriangle, 
  Edit, 
  Trash2,
  Filter,
  Calendar,
  User
} from 'lucide-react'
import { Note, Student, NoteType, UserRole } from '@/types'
import { AuthService } from '@/lib/auth'

interface NotesResponse {
  notes: Note[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [pinnedFilter, setPinnedFilter] = useState(false)
  const [importantFilter, setImportantFilter] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalNotes, setTotalNotes] = useState(0)

  useEffect(() => {
    fetchNotes()
    fetchStudents()
  }, [currentPage, selectedStudent, typeFilter, pinnedFilter, importantFilter])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(selectedStudent && { studentId: selectedStudent }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(pinnedFilter && { pinned: 'true' }),
        ...(importantFilter && { important: 'true' }),
      })

      const response = await fetch(`/api/notes?${params}`)
      if (response.ok) {
        const data: NotesResponse = await response.json()
        setNotes(data.notes)
        setTotalPages(data.pagination.pages)
        setTotalNotes(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=100&status=active')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleNoteSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes'
      const method = editingNote ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setShowNoteForm(false)
        setEditingNote(null)
        fetchNotes()
        // TODO: Show success toast
      } else {
        const error = await response.json()
        console.error('Note operation failed:', error.error)
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Note operation failed:', error)
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotes()
        // TODO: Show success toast
      } else {
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      // TODO: Show error toast
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchNotes()
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedStudent('all')
    setTypeFilter('all')
    setPinnedFilter(false)
    setImportantFilter(false)
    setCurrentPage(1)
  }

  const getNoteTypeColor = (type: NoteType) => {
    const colors = {
      [NoteType.GENERAL]: 'bg-gray-100 text-gray-800',
      [NoteType.HEALTH]: 'bg-red-100 text-red-800',
      [NoteType.BEHAVIOR]: 'bg-yellow-100 text-yellow-800',
      [NoteType.PAYMENT]: 'bg-blue-100 text-blue-800',
      [NoteType.ACADEMIC]: 'bg-green-100 text-green-800',
    }
    return colors[type] || colors[NoteType.GENERAL]
  }

  const getNoteTypeLabel = (type: NoteType) => {
    const labels = {
      [NoteType.GENERAL]: 'Genel',
      [NoteType.HEALTH]: 'Sağlık',
      [NoteType.BEHAVIOR]: 'Davranış',
      [NoteType.PAYMENT]: 'Ödeme',
      [NoteType.ACADEMIC]: 'Akademik',
    }
    return labels[type] || 'Genel'
  }

  const canEditNote = (note: Note) => {
    return user && (note.createdBy?.id === user.id || AuthService.isAdmin(user.role as UserRole))
  }

  if (showNoteForm) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NoteForm
            onSubmit={handleNoteSubmit}
            onCancel={() => {
              setShowNoteForm(false)
              setEditingNote(null)
            }}
            isLoading={isSubmitting}
            initialData={editingNote || undefined}
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
              <h1 className="text-2xl font-bold text-gray-900">Notlar</h1>
              <p className="text-gray-600">
                Öğrenci notlarını ve iletişimi yönetin
              </p>
            </div>
            <Button
              onClick={() => setShowNoteForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Not Ekle
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Öğrenci
              </label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm öğrenciler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm öğrenciler</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm tipler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm tipler</SelectItem>
                  <SelectItem value={NoteType.GENERAL}>Genel</SelectItem>
                  <SelectItem value={NoteType.HEALTH}>Sağlık</SelectItem>
                  <SelectItem value={NoteType.BEHAVIOR}>Davranış</SelectItem>
                  <SelectItem value={NoteType.PAYMENT}>Ödeme</SelectItem>
                  <SelectItem value={NoteType.ACADEMIC}>Akademik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Filtreler
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={pinnedFilter}
                    onChange={(e) => setPinnedFilter(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="pinned" className="text-sm text-gray-700">
                    Sabitlenmiş
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="important"
                    checked={importantFilter}
                    onChange={(e) => setImportantFilter(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="important" className="text-sm text-gray-700">
                    Önemli
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full">
                Filtreleri Sıfırla
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <StickyNote className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">
                  Toplam: {totalNotes} not
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-lg text-gray-600">Loading notes...</div>
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg text-gray-600 mb-2">No notes found</div>
              <p className="text-gray-500 mb-4">
                {selectedStudent || typeFilter !== 'all' || pinnedFilter || importantFilter
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first note'}
              </p>
              <Button
                onClick={() => setShowNoteForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Note
              </Button>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {note.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNoteTypeColor(note.type)}`}>
                          {getNoteTypeLabel(note.type)}
                        </span>
                        {note.isPinned && (
                          <Pin className="h-4 w-4 text-blue-600" />
                        )}
                        {note.isImportant && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {note.student?.firstName} {note.student?.lastName}
                          {note.student?.group && (
                            <span className="ml-2 text-gray-500">({note.student.group.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(note.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          By: {note.createdBy?.name}
                        </div>
                      </div>

                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>

                    {canEditNote(note) && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingNote(note)
                            setShowNoteForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
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
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}