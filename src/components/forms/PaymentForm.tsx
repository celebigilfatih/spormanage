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
  dueDate: z.string().min(1, 'Vade tarihi zorunludur'),
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
      dueDate: new Date(initialData.dueDate).toISOString().split('T')[0],
      notes: initialData.notes || ''
    } : {
      studentId: '',
      feeTypeId: '',
      amount: '',
      dueDate: '',
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
    // Auto-fill amount when fee type is selected
    if (feeTypeId && !initialData) {
      const selectedFeeType = feeTypes.find(ft => ft.id === feeTypeId)
      if (selectedFeeType) {
        setValue('amount', selectedFeeType.amount.toString())
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

        {/* Amount */}
        <div>
          <Label htmlFor="amount">Tutar (₺) *</Label>
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

        {/* Due Date */}
        <div>
          <Label htmlFor="dueDate">Vade Tarihi *</Label>
          <Input
            id="dueDate"
            type="date"
            {...register('dueDate')}
            className={errors.dueDate ? 'border-red-500' : ''}
          />
          {errors.dueDate && (
            <p className="text-sm text-red-600 mt-1">{errors.dueDate.message}</p>
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
