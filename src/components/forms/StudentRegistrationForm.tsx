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
import { StudentFormData, Group } from '@/types'

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
}

export function StudentRegistrationForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: StudentRegistrationFormProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      parents: [
        {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          address: '',
          relationship: 'Anne',
          isEmergency: false,
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
    }
    setValue(`parents.${index}.isPrimary`, value)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Yeni Öğrenci Kaydı</h2>
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
              <Select onValueChange={(value) => setValue('groupId', value)}>
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
                    <Label htmlFor={`parents.${index}.firstName`}>First Name *</Label>
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
                    <Label htmlFor={`parents.${index}.lastName`}>Last Name *</Label>
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
                      placeholder="parent@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`parents.${index}.relationship`}>Relationship *</Label>
                    <Select
                      onValueChange={(value) => setValue(`parents.${index}.relationship`, value)}
                      defaultValue={watchedParents[index]?.relationship}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
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
                    <Label htmlFor={`parents.${index}.address`}>Address</Label>
                    <Input
                      {...register(`parents.${index}.address`)}
                      placeholder="Full address"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`parents.${index}.isPrimary`}
                        {...register(`parents.${index}.isPrimary`)}
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
                        {...register(`parents.${index}.isEmergency`)}
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
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Saving...' : 'Register Student'}
          </Button>
        </div>
      </form>
    </div>
  )
}