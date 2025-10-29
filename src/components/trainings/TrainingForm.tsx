'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react'
import { Group, Training, TrainingFormData } from '@/types'

const sessionSchema = z.object({
  date: z.string().min(1, 'Tarih gerekli'),
  startTime: z.string().min(1, 'Başlangıç saati gerekli'),
  endTime: z.string().min(1, 'Bitiş saati gerekli'),
  location: z.string().optional(),
  notes: z.string().optional(),
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

const trainingSchema = z.object({
  groupId: z.string().min(1, 'Grup gerekli'),
  name: z.string().min(1, 'Antrenman adı gerekli'),
  description: z.string().optional(),
  sessions: z.array(sessionSchema).min(1, 'En az bir antrenman tarihi ekleyin')
})

interface TrainingFormProps {
  onSubmit: (data: TrainingFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Training
  training?: any // For editing mode
}

export function TrainingForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialData,
  training
}: TrainingFormProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  // Use training prop if provided, otherwise use initialData
  const editData = training || initialData;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors }
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      groupId: editData?.groupId || '',
      name: editData?.name || '',
      description: editData?.description || '',
      sessions: editData?.sessions && editData.sessions.length > 0 ? editData.sessions.map((s: any) => ({
        date: new Date(s.date).toISOString().split('T')[0],
        startTime: new Date(s.startTime).toTimeString().slice(0, 5),
        endTime: new Date(s.endTime).toTimeString().slice(0, 5),
        location: s.location || '',
        notes: s.notes || ''
      })) : [{
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        notes: ''
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sessions'
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

  const formatDuration = (startTime: string, endTime: string) => {
    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${endTime}`)
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

  const addSession = () => {
    append({
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      notes: ''
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Left Column - Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Temel Bilgiler</h3>
          </div>

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
              rows={4}
              placeholder="Antrenman içeriği ve amaçları hakkında kısa açıklama"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Preview */}
          {watchedValues.name && watchedValues.sessions && watchedValues.sessions.length > 0 && watchedValues.sessions[0].date && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Önizleme</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div><span className="font-medium">Antrenman:</span> {watchedValues.name}</div>
                <div>
                  <span className="font-medium">Grup:</span> {
                    groups.find(g => g.id === watchedValues.groupId)?.name || 'Seçilmedi'
                  }
                </div>
                <div><span className="font-medium">Toplam Seans:</span> {watchedValues.sessions.filter(s => s.date).length}</div>
                {watchedValues.description && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <span className="font-medium">Açıklama:</span>
                    <p className="text-xs mt-1">{watchedValues.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Antrenman Tarihleri</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSession}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tarih Ekle
            </Button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">Seans #{index + 1}</Label>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`sessions.${index}.date`}>Tarih *</Label>
                    <Input
                      id={`sessions.${index}.date`}
                      type="date"
                      {...register(`sessions.${index}.date`)}
                      className={errors.sessions?.[index]?.date ? 'border-red-500' : ''}
                    />
                    {errors.sessions?.[index]?.date && (
                      <p className="text-red-500 text-sm mt-1">{errors.sessions[index]?.date?.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`sessions.${index}.startTime`}>Başlangıç *</Label>
                    <Input
                      id={`sessions.${index}.startTime`}
                      type="time"
                      {...register(`sessions.${index}.startTime`)}
                      className={errors.sessions?.[index]?.startTime ? 'border-red-500' : ''}
                    />
                    {errors.sessions?.[index]?.startTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.sessions[index]?.startTime?.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`sessions.${index}.endTime`}>Bitiş *</Label>
                    <Input
                      id={`sessions.${index}.endTime`}
                      type="time"
                      {...register(`sessions.${index}.endTime`)}
                      className={errors.sessions?.[index]?.endTime ? 'border-red-500' : ''}
                    />
                    {errors.sessions?.[index]?.endTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.sessions[index]?.endTime?.message}</p>
                    )}
                  </div>
                </div>

                {/* Duration Display */}
                {watchedValues.sessions?.[index]?.startTime && watchedValues.sessions?.[index]?.endTime && (
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Süre: {formatDuration(watchedValues.sessions[index].startTime, watchedValues.sessions[index].endTime)}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`sessions.${index}.location`}>
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Konum
                    </Label>
                    <Input
                      id={`sessions.${index}.location`}
                      {...register(`sessions.${index}.location`)}
                      placeholder="örn., Ana Saha, Spor Salonu"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`sessions.${index}.notes`}>Notlar</Label>
                    <Input
                      id={`sessions.${index}.notes`}
                      {...register(`sessions.${index}.notes`)}
                      placeholder="Bu seans için özel notlar"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.sessions && typeof errors.sessions === 'object' && 'message' in errors.sessions && (
            <p className="text-red-500 text-sm mt-1">{errors.sessions.message as string}</p>
          )}
        </div>
      </div>

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
  )
}
