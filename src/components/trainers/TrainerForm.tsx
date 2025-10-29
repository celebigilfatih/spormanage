'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Briefcase, Award, Camera, FileText } from 'lucide-react'

const trainerSchema = z.object({
  name: z.string().min(1, 'Ad Soyad gerekli'),
  position: z.string().min(1, 'Pozisyon gerekli'),
  experience: z.number().min(0, 'Deneyim 0 veya daha fazla olmalıdır'),
  license: z.string().optional(),
  photo: z.string().optional(),
  biography: z.string().optional(),
})

type TrainerFormData = z.infer<typeof trainerSchema>

interface TrainerFormProps {
  trainer?: any
  onSubmit: (data: TrainerFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const positions = [
  'Teknik Direktör',
  'Antrenör',
  'Yardımcı Antrenör',
  'Kaleci Antrenörü',
  'Kondisyon Antrenörü',
  'Fizyoterapist',
]

export function TrainerForm({ 
  trainer,
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TrainerFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(trainer?.photo || null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      name: trainer?.name || '',
      position: trainer?.position || '',
      experience: trainer?.experience || 0,
      license: trainer?.license || '',
      photo: trainer?.photo || '',
      biography: trainer?.biography || '',
    }
  })

  const watchedPosition = watch('position')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload this to a server/cloud storage
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPhotoPreview(result)
        setValue('photo', result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Ad Soyad */}
          <div>
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Ad Soyad *
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Teknik kadro üyesinin adı ve soyadı"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Pozisyon */}
          <div>
            <Label htmlFor="position" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Pozisyon *
            </Label>
            <Select 
              onValueChange={(value) => setValue('position', value)}
              defaultValue={watchedPosition}
            >
              <SelectTrigger className={errors.position ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pozisyon seçin" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.position && (
              <p className="text-red-500 text-sm mt-1">{errors.position.message}</p>
            )}
          </div>

          {/* Deneyim */}
          <div>
            <Label htmlFor="experience" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Deneyim (yıl)
            </Label>
            <Input
              id="experience"
              type="number"
              min="0"
              {...register('experience', { valueAsNumber: true })}
              placeholder="Örn: 15 yıl"
              className={errors.experience ? 'border-red-500' : ''}
            />
            {errors.experience && (
              <p className="text-red-500 text-sm mt-1">{errors.experience.message}</p>
            )}
          </div>

          {/* Lisans/Sertifika */}
          <div>
            <Label htmlFor="license" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Lisans/Sertifika
            </Label>
            <Input
              id="license"
              {...register('license')}
              placeholder="Örn: UEFA PRO Lisansı"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Fotoğraf */}
          <div>
            <Label htmlFor="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotoğraf
            </Label>
            <div className="space-y-4">
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                JPG, PNG formatlarında maksimum 2MB boyutunda fotoğraf yükleyebilirsiniz.
              </p>
              {photoPreview && (
                <div className="mt-4">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Biyografi */}
          <div>
            <Label htmlFor="biography" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Biyografi
            </Label>
            <textarea
              id="biography"
              {...register('biography')}
              rows={8}
              placeholder="Teknik kadro üyesi hakkında kısa bilgi..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
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
          {isLoading ? 'Kaydediliyor...' : trainer ? 'Güncelle' : 'Kaydet'}
        </Button>
      </div>
    </form>
  )
}
