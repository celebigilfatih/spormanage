'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Payment, Student, FeeType, PaymentMethod } from '@/types'
import { useState, useEffect } from 'react'

const paymentSchema = z.object({
  studentId: z.string().min(1, 'Öğrenci seçimi zorunludur'),
  feeTypeId: z.string().min(1, 'Ücret tipi seçimi zorunludur'),
  amount: z.string().min(1, 'Tutar zorunludur'),
  installmentCount: z.string().min(1, 'Vade sayısı zorunludur'),
  startDate: z.string().min(1, 'Başlangıç tarihi zorunludur'),
  notes: z.string().optional()
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Payment | null
  mode?: 'create' | 'edit'
}

export function PaymentForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  initialData = null,
  mode = 'create'
}: PaymentFormProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: initialData ? {
      studentId: initialData.studentId,
      feeTypeId: initialData.feeTypeId,
      amount: initialData.amount.toString(),
      installmentCount: '1',
      startDate: new Date(initialData.dueDate).toISOString().split('T')[0],
      notes: initialData.notes || ''
    } : {
      studentId: '',
      feeTypeId: '',
      amount: '',
      installmentCount: '1',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
  })

  const studentId = watch('studentId')
  const feeTypeId = watch('feeTypeId')

  useEffect(() => {
    fetchStudents()
    fetchFeeTypes()
  }, [])

  useEffect(() => {
    // Auto-fill amount and installment count when fee type is selected
    if (feeTypeId && !initialData) {
      const selectedFeeType = feeTypes.find(ft => ft.id === feeTypeId)
      if (selectedFeeType) {
        setValue('amount', selectedFeeType.amount.toString())
        
        // Set default installment count based on period
        switch (selectedFeeType.period) {
          case 'MONTHLY':
            setValue('installmentCount', '12') // 12 months
            break
          case 'QUARTERLY':
            setValue('installmentCount', '4') // 4 quarters
            break
          case 'YEARLY':
            setValue('installmentCount', '1') // 1 year
            break
          case 'ONE_TIME':
            setValue('installmentCount', '1') // Single payment
            break
          default:
            setValue('installmentCount', '1')
        }
      }
    }
  }, [feeTypeId, feeTypes, initialData, setValue])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?status=active&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchFeeTypes = async () => {
    try {
      const response = await fetch('/api/fee-types')
      if (response.ok) {
        const data = await response.json()
        setFeeTypes(data)
      }
    } catch (error) {
      console.error('Failed to fetch fee types:', error)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {mode === 'edit' ? 'Ödeme Düzenle' : 'Yeni Ödeme Kaydı'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Selection */}
        <div>
          <Label htmlFor="studentId">Öğrenci *</Label>
          <Select
            value={studentId}
            onValueChange={(value) => setValue('studentId', value)}
            disabled={mode === 'edit'}
          >
            <SelectTrigger className={errors.studentId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Öğrenci seçin..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                  {student.group && ` - ${student.group.name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.studentId && (
            <p className="text-sm text-red-600 mt-1">{errors.studentId.message}</p>
          )}
        </div>

        {/* Fee Type Selection */}
        <div>
          <Label htmlFor="feeTypeId">Ücret Tipi *</Label>
          <Select
            value={feeTypeId}
            onValueChange={(value) => setValue('feeTypeId', value)}
            disabled={mode === 'edit'}
          >
            <SelectTrigger className={errors.feeTypeId ? 'border-red-500' : ''}>
              <SelectValue placeholder="Ücret tipi seçin..." />
            </SelectTrigger>
            <SelectContent>
              {feeTypes.map((feeType) => (
                <SelectItem key={feeType.id} value={feeType.id}>
                  {feeType.name} - {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                  }).format(feeType.amount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.feeTypeId && (
            <p className="text-sm text-red-600 mt-1">{errors.feeTypeId.message}</p>
          )}
        </div>

        {/* Amount per Installment */}
        <div>
          <Label htmlFor="amount">Vade Başına Tutar (₺) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount')}
            className={errors.amount ? 'border-red-500' : ''}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Installment Count */}
        <div>
          <Label htmlFor="installmentCount">Vade Sayısı *</Label>
          <Input
            id="installmentCount"
            type="number"
            min="1"
            max="12"
            {...register('installmentCount')}
            className={errors.installmentCount ? 'border-red-500' : ''}
            placeholder="1"
          />
          {errors.installmentCount && (
            <p className="text-sm text-red-600 mt-1">{errors.installmentCount.message}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Toplam: {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(parseFloat(watch('amount') || '0') * parseInt(watch('installmentCount') || '1'))}
          </p>
        </div>

        {/* Start Date */}
        <div>
          <Label htmlFor="startDate">İlk Vade Tarihi *</Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && (
            <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
          )}
          {feeTypeId && (
            <p className="text-sm text-muted-foreground mt-1">
              {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'MONTHLY' && 'Her ay bir vade oluşturulacak'}
              {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'QUARTERLY' && 'Her 3 ayda bir vade oluşturulacak'}
              {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'YEARLY' && 'Her yıl bir vade oluşturulacak'}
              {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'ONE_TIME' && 'Tek seferlik ödeme oluşturulacak'}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Ödeme ile ilgili notlar..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
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
            disabled={isLoading || loadingData}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Kaydediliyor...' : mode === 'edit' ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
