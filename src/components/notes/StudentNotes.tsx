'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { NoteForm } from './NoteForm'
import { 
  StickyNote, 
  Pin, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  User
} from 'lucide-react'
import { Note, NoteType } from '@/types'

interface StudentNotesProps {
  studentId: string
  studentName: string
}

export function StudentNotes({ studentId, studentName }: StudentNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [studentId])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notes?studentId=${studentId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
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
      }
    } catch (error) {
      console.error('Note operation failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotes()
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
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

  if (showNoteForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {editingNote ? 'Notu Düzenle' : 'Not Ekle'} - {studentName}
          </h3>
        </div>
        <NoteForm
          onSubmit={handleNoteSubmit}
          onCancel={() => {
            setShowNoteForm(false)
            setEditingNote(null)
          }}
          isLoading={isSubmitting}
          initialData={editingNote || undefined}
          preselectedStudentId={studentId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Notlar</h3>
        <Button
          onClick={() => setShowNoteForm(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Not Ekle
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="text-gray-600">Loading notes...</div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <StickyNote className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-gray-600 mb-2">No notes yet</div>
          <Button
            onClick={() => setShowNoteForm(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Note
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{note.title}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getNoteTypeColor(note.type)}`}>
                      {getNoteTypeLabel(note.type)}
                    </span>
                    {note.isPinned && (
                      <Pin className="h-4 w-4 text-blue-600" />
                    )}
                    {note.isImportant && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {note.createdBy?.name}
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
                </div>

                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingNote(note)
                      setShowNoteForm(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}