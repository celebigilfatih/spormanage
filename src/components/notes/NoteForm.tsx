'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StickyNote, AlertTriangle, Pin } from 'lucide-react'
import { Student, NoteType, Note } from '@/types'

const noteSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.nativeEnum(NoteType),
  isPinned: z.boolean(),
  isImportant: z.boolean(),
})

interface NoteFormData {
  studentId: string
  title: string
  content: string
  type: NoteType
  isPinned: boolean
  isImportant: boolean
}

interface NoteFormProps {
  onSubmit: (data: NoteFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Note
  preselectedStudentId?: string
}

export function NoteForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialData,
  preselectedStudentId
}: NoteFormProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      studentId: preselectedStudentId || initialData?.studentId || '',
      title: initialData?.title || '',
      content: initialData?.content || '',
      type: initialData?.type || NoteType.GENERAL,
      isPinned: initialData?.isPinned || false,
      isImportant: initialData?.isImportant || false,
    }
  })

  const watchedValues = watch()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=100&status=active')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const noteTypeLabels = {
    [NoteType.GENERAL]: 'Genel',
    [NoteType.HEALTH]: 'Sağlık',
    [NoteType.BEHAVIOR]: 'Davranış',
    [NoteType.PAYMENT]: 'Ödeme',
    [NoteType.ACADEMIC]: 'Akademik',
  }

  const noteTypeColors = {
    [NoteType.GENERAL]: 'text-gray-600',
    [NoteType.HEALTH]: 'text-red-600',
    [NoteType.BEHAVIOR]: 'text-yellow-600',
    [NoteType.PAYMENT]: 'text-blue-600',
    [NoteType.ACADEMIC]: 'text-green-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <StickyNote className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Notu Düzenle' : 'Yeni Not Ekle'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Selection */}
        {!preselectedStudentId && (
          <div>
            <Label htmlFor="studentId">Öğrenci *</Label>
            <Select 
              onValueChange={(value) => setValue('studentId', value)}
              defaultValue={watchedValues.studentId}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingStudents ? "Yükleniyor..." : "Öğrenci seçin"} />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                    {student.group && (
                      <span className="text-gray-500 ml-2">({student.group.name})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.studentId && (
              <p className="text-red-500 text-sm mt-1">{errors.studentId.message}</p>
            )}
          </div>
        )}

        {preselectedStudentId && (
          <input type="hidden" {...register('studentId')} />
        )}

        {/* Note Type */}
        <div>
          <Label htmlFor="type">Not Türü *</Label>
          <Select 
            onValueChange={(value) => setValue('type', value as NoteType)}
            defaultValue={watchedValues.type}
          >
            <SelectTrigger>
              <SelectValue placeholder="Not türü seçin" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(noteTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <span className={noteTypeColors[value as NoteType]}>
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Başlık *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Not başlığı"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <Label htmlFor="content">İçerik *</Label>
          <textarea
            id="content"
            {...register('content')}
            rows={5}
            placeholder="Notunuzu buraya yazın..."
            className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.content ? 'border-red-500' : ''
            }`}
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPinned"
              {...register('isPinned')}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isPinned" className="flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Bu notu sabitle (üstte göster)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isImportant"
              {...register('isImportant')}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isImportant" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Önemli olarak işaretle
            </Label>
          </div>
        </div>

        {/* Preview */}
        {watchedValues.title && watchedValues.content && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Önizleme</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{watchedValues.title}</h5>
                <div className="flex items-center gap-2">
                  {watchedValues.isPinned && (
                    <Pin className="h-4 w-4 text-blue-600" />
                  )}
                  {watchedValues.isImportant && (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${noteTypeColors[watchedValues.type]}`}>
                    {noteTypeLabels[watchedValues.type]}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{watchedValues.content}</p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Kaydediliyor...' : (initialData ? 'Notu Güncelle' : 'Not Ekle')}
          </Button>
        </div>
      </form>
    </div>
  )
}