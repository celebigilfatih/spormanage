'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Users, User } from 'lucide-react'
import { StudentFormData, Group, Student } from '@/types'

const parentSchema = z.object({
  firstName: z.string().min(1, 'Ad gerekli'),
  lastName: z.string().min(1, 'Soyad gerekli'),
  phone: z.string().min(1, 'Telefon gerekli'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  relationship: z.string().min(1, 'Yakinlik gerekli'),
  isEmergency: z.boolean(),
  isPrimary: z.boolean(),
})

const studentSchema = z.object({
  firstName: z.string().min(1, 'Ad gerekli'),
  lastName: z.string().min(1, 'Soyad gerekli'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  groupId: z.string().optional(),
  parents: z.array(parentSchema).min(1, 'En az bir veli gerekli')
}).refine((data) => {
  return data.parents.some(parent => parent.isPrimary)
}, {
  message: "En az bir veli ana iletişim olarak işaretlenmelidir",
  path: ["parents"]
})

const relationshipOptions = [
  'Anne',
  'Baba', 
  'Abla',
  'Abi',
  'Teyze',
  'Amca',
  'Dede',
  'Nine',
  'Vasi',
  'Diğer'
]

interface StudentRegistrationFormProps {
  onSubmit: (data: StudentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Student | null
  mode?: 'create' | 'edit'
}

export function StudentRegistrationForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialData = null,
  mode = 'create'
}: StudentRegistrationFormProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: initialData ? {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      phone: initialData.phone || '',
      birthDate: initialData.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
      // Extract groupId from either groupId field or group.id
      groupId: initialData.groupId || (initialData.group?.id) || '',
      parents: initialData.parents && initialData.parents.length > 0 ? initialData.parents : [
        {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          address: '',
          relationship: 'Anne',
          isEmergency: true,
          isPrimary: true,
        }
      ]
    } : {
      parents: [
        {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          address: '',
          relationship: 'Anne',
          isEmergency: true,
          isPrimary: true,
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parents'
  })

  const watchedParents = watch('parents')

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        phone: initialData.phone || '',
        birthDate: initialData.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
        groupId: initialData.groupId || (initialData.group?.id) || '',
        parents: initialData.parents && initialData.parents.length > 0 ? initialData.parents.map(p => ({
          ...p,
          email: p.email || '',
          address: p.address || ''
        })) : [
          {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            address: '',
            relationship: 'Anne',
            isEmergency: true,
            isPrimary: true,
          }
        ]
      })
    }
  }, [initialData, mode, reset])

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const addParent = () => {
    append({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      relationship: 'Baba',
      isEmergency: false,
      isPrimary: false,
    })
  }

  const removeParent = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handlePrimaryChange = (index: number, value: boolean) => {
    if (value) {
      // Unset all other primary flags
      watchedParents.forEach((_, i) => {
        if (i !== index) {
          setValue(`parents.${i}.isPrimary`, false)
        }
      })
      // Set emergency contact to true when primary is selected
      setValue(`parents.${index}.isEmergency`, true)
    }
    setValue(`parents.${index}.isPrimary`, value)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'edit' ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Kaydı'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Student Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Öğrenci Bilgileri</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Ad *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Soyad *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+90 555 123 4567"
              />
            </div>

            <div>
              <Label htmlFor="birthDate">Doğum Tarihi</Label>
              <Input
                id="birthDate"
                type="date"
                {...register('birthDate')}
              />
            </div>

            <div>
              <Label htmlFor="groupId">Grup</Label>
              <Select 
                onValueChange={(value) => setValue('groupId', value)}
                value={watch('groupId') || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingGroups ? "Yükleniyor..." : "Grup seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} {group.description && `- ${group.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Veli/Vasi Bilgileri</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addParent}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Veli Ekle
            </Button>
          </div>

          {errors.parents && typeof errors.parents.message === 'string' && (
            <p className="text-red-500 text-sm mb-4">{errors.parents.message}</p>
          )}

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">
                    Veli/Vasi {index + 1}
                  </h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeParent(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`parents.${index}.firstName`}>Ad *</Label>
                    <Input
                      {...register(`parents.${index}.firstName`)}
                      className={errors.parents?.[index]?.firstName ? 'border-red-500' : ''}
                    />
                    {errors.parents?.[index]?.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.parents[index]?.firstName?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`parents.${index}.lastName`}>Soyad *</Label>
                    <Input
                      {...register(`parents.${index}.lastName`)}
                      className={errors.parents?.[index]?.lastName ? 'border-red-500' : ''}
                    />
                    {errors.parents?.[index]?.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.parents[index]?.lastName?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`parents.${index}.phone`}>Telefon *</Label>
                    <Input
                      {...register(`parents.${index}.phone`)}
                      placeholder="+90 555 123 4567"
                      className={errors.parents?.[index]?.phone ? 'border-red-500' : ''}
                    />
                    {errors.parents?.[index]?.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.parents[index]?.phone?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`parents.${index}.email`}>Email</Label>
                    <Input
                      type="email"
                      {...register(`parents.${index}.email`)}
                      placeholder="veli@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`parents.${index}.relationship`}>Yakınlık *</Label>
                    <Select
                      onValueChange={(value) => setValue(`parents.${index}.relationship`, value)}
                      defaultValue={watchedParents[index]?.relationship}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Yakınlık seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`parents.${index}.address`}>Adres</Label>
                    <Input
                      {...register(`parents.${index}.address`)}
                      placeholder="Tam adres"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`parents.${index}.isPrimary`}
                        checked={watchedParents[index]?.isPrimary || false}
                        onChange={(e) => handlePrimaryChange(index, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`parents.${index}.isPrimary`} className="text-sm">
                        Ana İletişim
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`parents.${index}.isEmergency`}
                        checked={watchedParents[index]?.isEmergency || false}
                        onChange={(e) => setValue(`parents.${index}.isEmergency`, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`parents.${index}.isEmergency`} className="text-sm">
                        Acil Durum İletişimi
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            {isLoading ? 'Kaydediliyor...' : mode === 'edit' ? 'Öğrenciyi Güncelle' : 'Öğrenciyi Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}