'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, Plus, Trash2, AlertTriangle, Save } from 'lucide-react'
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
        return hours > 0 ? `${hours} sa ${minutes} dk` : `${minutes} dk`
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Left Column - Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Temel Bilgiler</h3>
            </div>

            <div className="space-y-5">
              {/* Group Selection */}
              <div className="space-y-2">
                <Label htmlFor="groupId" className="text-sm font-bold text-gray-700">Grup *</Label>
                <Select 
                  onValueChange={(value) => setValue('groupId', value)}
                  defaultValue={watchedValues.groupId}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 focus:ring-blue-500">
                    <SelectValue placeholder={loadingGroups ? "Yükleniyor..." : "Grup seçin"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id} className="rounded-lg">
                        {group.name}
                        {group.description && (
                          <span className="text-gray-500 ml-2 font-normal">- {group.description}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.groupId && (
                  <p className="text-red-500 text-xs font-medium mt-1">{errors.groupId.message}</p>
                )}
              </div>

              {/* Training Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-gray-700">Antrenman Adı *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="örn., Teknik Beceriler, Kondisyon"
                  className={`rounded-xl border-gray-200 focus:ring-blue-500 ${errors.name ? 'border-red-500 bg-red-50' : ''}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs font-medium mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold text-gray-700">Açıklama</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  placeholder="Antrenman içeriği ve amaçları..."
                  className="flex w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {watchedValues.name && watchedValues.sessions && watchedValues.sessions.length > 0 && watchedValues.sessions[0].date && (
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Plan Özeti
              </h4>
              <div className="text-sm text-blue-800 space-y-3">
                <div className="flex justify-between border-b border-blue-100 pb-2">
                  <span className="text-blue-600 font-medium">Antrenman:</span>
                  <span className="font-bold">{watchedValues.name}</span>
                </div>
                <div className="flex justify-between border-b border-blue-100 pb-2">
                  <span className="text-blue-600 font-medium">Grup:</span>
                  <span className="font-bold">
                    {groups.find(g => g.id === watchedValues.groupId)?.name || 'Seçilmedi'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-blue-100 pb-2">
                  <span className="text-blue-600 font-medium">Toplam Seans:</span>
                  <span className="font-bold">{watchedValues.sessions.filter(s => s.date).length} seans</span>
                </div>
                {watchedValues.description && (
                  <div className="mt-3">
                    <span className="text-blue-600 font-medium block mb-1">Açıklama:</span>
                    <p className="text-xs leading-relaxed bg-white/50 p-2 rounded-lg border border-blue-100">{watchedValues.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Antrenman Tarihleri</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSession}
                disabled={isLoading}
                className="rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-bold px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tarih Ekle
              </Button>
            </div>

            <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200">
              {fields.map((field, index) => (
                <div key={field.id} className="relative border border-gray-100 rounded-2xl p-6 bg-gray-50/50 hover:bg-white transition-all hover:shadow-md group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-xs font-black text-gray-500 uppercase tracking-widest">
                      Seans #{index + 1}
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={isLoading}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor={`sessions.${index}.date`} className="text-xs font-bold text-gray-500 uppercase">Tarih *</Label>
                      <Input
                        id={`sessions.${index}.date`}
                        type="date"
                        {...register(`sessions.${index}.date`)}
                        className={`rounded-xl border-gray-200 focus:ring-blue-500 ${errors.sessions?.[index]?.date ? 'border-red-500 bg-red-50' : ''}`}
                      />
                      {errors.sessions?.[index]?.date && (
                        <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.sessions[index]?.date?.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`sessions.${index}.startTime`} className="text-xs font-bold text-gray-500 uppercase">Başlangıç *</Label>
                      <Input
                        id={`sessions.${index}.startTime`}
                        type="time"
                        {...register(`sessions.${index}.startTime`)}
                        className={`rounded-xl border-gray-200 focus:ring-blue-500 ${errors.sessions?.[index]?.startTime ? 'border-red-500 bg-red-50' : ''}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`sessions.${index}.endTime`} className="text-xs font-bold text-gray-500 uppercase">Bitiş *</Label>
                      <Input
                        id={`sessions.${index}.endTime`}
                        type="time"
                        {...register(`sessions.${index}.endTime`)}
                        className={`rounded-xl border-gray-200 focus:ring-blue-500 ${errors.sessions?.[index]?.endTime ? 'border-red-500 bg-red-50' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Duration and Error Display */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    {watchedValues.sessions?.[index]?.startTime && watchedValues.sessions?.[index]?.endTime && (
                      <div className="px-3 py-1.5 bg-blue-50 rounded-lg text-xs font-bold text-blue-700 flex items-center gap-2 border border-blue-100">
                        <Clock className="h-3.5 w-3.5" />
                        Süre: {formatDuration(watchedValues.sessions[index].startTime, watchedValues.sessions[index].endTime)}
                      </div>
                    )}
                    {errors.sessions?.[index]?.endTime && (
                      <p className="text-red-600 text-xs font-bold flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {errors.sessions[index]?.endTime?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`sessions.${index}.location`} className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        Konum
                      </Label>
                      <Input
                        id={`sessions.${index}.location`}
                        {...register(`sessions.${index}.location`)}
                        placeholder="örn., Ana Saha"
                        className="rounded-xl border-gray-200 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`sessions.${index}.notes`} className="text-xs font-bold text-gray-500 uppercase">Notlar</Label>
                      <Input
                        id={`sessions.${index}.notes`}
                        {...register(`sessions.${index}.notes`)}
                        placeholder="Özel notlar..."
                        className="rounded-xl border-gray-200 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.sessions && typeof errors.sessions === 'object' && 'message' in errors.sessions && (
              <p className="text-red-500 text-sm font-bold mt-4 p-4 bg-red-50 rounded-xl border border-red-100">{errors.sessions.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl border-gray-200 px-8 h-12 font-bold order-2 sm:order-1"
        >
          İptal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 order-1 sm:order-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Kaydediliyor...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              <span>{initialData ? 'Antrenmanı Güncelle' : 'Antrenmanı Planla'}</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  )
}
