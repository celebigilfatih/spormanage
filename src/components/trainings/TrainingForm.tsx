'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { Group, Training } from '@/types'

const trainingSchema = z.object({
  groupId: z.string().min(1, 'Grup gerekli'),
  name: z.string().min(1, 'Antrenman adı gerekli'),
  description: z.string().optional(),
  date: z.string().min(1, 'Tarih gerekli'),
  startTime: z.string().min(1, 'Başlangıç saati gerekli'),
  endTime: z.string().min(1, 'Bitiş saati gerekli'),
  location: z.string().optional(),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    const start = new Date(`2000-01-01T${data.startTime}`)
    const end = new Date(`2000-01-01T${data.endTime}`)
    return start < end
  }
  return true
}, {
  message: "Bitiş saati başlangıç saatinden sonra olmalıdır",
  path: ["endTime"]
})

interface TrainingFormData {
  groupId: string
  name: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location?: string
}

interface TrainingFormProps {
  onSubmit: (data: TrainingFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Training
}

export function TrainingForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialData
}: TrainingFormProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      groupId: initialData?.groupId || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
      startTime: initialData?.startTime ? new Date(initialData.startTime).toTimeString().slice(0, 5) : '',
      endTime: initialData?.endTime ? new Date(initialData.endTime).toTimeString().slice(0, 5) : '',
      location: initialData?.location || '',
    }
  })

  const watchedValues = watch()

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.filter((g: Group) => g.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const formatDuration = () => {
    if (watchedValues.startTime && watchedValues.endTime) {
      const start = new Date(`2000-01-01T${watchedValues.startTime}`)
      const end = new Date(`2000-01-01T${watchedValues.endTime}`)
      const diffMs = end.getTime() - start.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      
      if (diffMins > 0) {
        const hours = Math.floor(diffMins / 60)
        const minutes = diffMins % 60
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      }
    }
    return ''
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Antrenmanı Düzenle' : 'Yeni Antrenman Planla'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Group Selection */}
        <div>
          <Label htmlFor="groupId">Grup *</Label>
          <Select 
            onValueChange={(value) => setValue('groupId', value)}
            defaultValue={watchedValues.groupId}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingGroups ? "Yükleniyor..." : "Grup seçin"} />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                  {group.description && (
                    <span className="text-gray-500 ml-2">- {group.description}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.groupId && (
            <p className="text-red-500 text-sm mt-1">{errors.groupId.message}</p>
          )}
        </div>

        {/* Training Name */}
        <div>
          <Label htmlFor="name">Antrenman Adı *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="örn., Teknik Beceriler, Kondisyon Antrenmanı, Maç Prova"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Açıklama</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            placeholder="Antrenman içeriği ve amaçları hakkında kısa açıklama"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="date">Tarih *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="startTime">Başlangıç Saati *</Label>
            <Input
              id="startTime"
              type="time"
              {...register('startTime')}
              className={errors.startTime ? 'border-red-500' : ''}
            />
            {errors.startTime && (
              <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="endTime">Bitiş Saati *</Label>
            <Input
              id="endTime"
              type="time"
              {...register('endTime')}
              className={errors.endTime ? 'border-red-500' : ''}
            />
            {errors.endTime && (
              <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Duration Display */}
        {formatDuration() && (
          <div className="text-sm text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            Süre: {formatDuration()}
          </div>
        )}

        {/* Location */}
        <div>
          <Label htmlFor="location">Konum</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="örn., Ana Saha, Spor Salonu, Kapalı Kort"
          />
        </div>

        {/* Preview */}
        {watchedValues.name && watchedValues.date && watchedValues.startTime && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Antrenman Önizlemesi</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><span className="font-medium">Antrenman:</span> {watchedValues.name}</div>
              <div>
                <span className="font-medium">Grup:</span> {
                  groups.find(g => g.id === watchedValues.groupId)?.name || 'Seçilmedi'
                }
              </div>
              <div>
                <span className="font-medium">Tarih:</span> {
                  new Date(watchedValues.date).toLocaleDateString('tr-TR')
                }
              </div>
              <div>
                <span className="font-medium">Saat:</span> {watchedValues.startTime}
                {watchedValues.endTime && ` - ${watchedValues.endTime}`}
                {formatDuration() && ` (${formatDuration()})`}
              </div>
              {watchedValues.location && (
                <div><span className="font-medium">Konum:</span> {watchedValues.location}</div>
              )}
              {watchedValues.description && (
                <div><span className="font-medium">Açıklama:</span> {watchedValues.description}</div>
              )}
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
            {isLoading ? 'Kaydediliyor...' : (initialData ? 'Antrenmanı Güncelle' : 'Antrenmanı Planla')}
          </Button>
        </div>
      </form>
    </div>
  )
}