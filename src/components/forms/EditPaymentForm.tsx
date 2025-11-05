'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Payment } from '@/types'

const editPaymentSchema = z.object({
  amount: z.string().min(1, 'Tutar zorunludur'),
  dueDate: z.string().min(1, 'Vade tarihi zorunludur'),
  notes: z.string().optional()
})

type EditPaymentFormData = z.infer<typeof editPaymentSchema>

interface EditPaymentFormProps {
  payment: Payment
  onSubmit: (data: EditPaymentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function EditPaymentForm({ 
  payment,
  onSubmit, 
  onCancel, 
  isLoading = false
}: EditPaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<EditPaymentFormData>({
    resolver: zodResolver(editPaymentSchema),
    defaultValues: {
      amount: payment.amount.toString(),
      dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
      notes: payment.notes || ''
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Ödeme Düzenle</h2>

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Öğrenci:</span>
          <span>{payment.student?.firstName} {payment.student?.lastName}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Ücret Tipi:</span>
          <span>{payment.feeType?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Durum:</span>
          <span className="text-sm">
            {payment.status === 'PENDING' && 'Bekliyor'}
            {payment.status === 'PARTIAL' && 'Kısmi Ödeme'}
            {payment.status === 'PAID' && 'Ödendi'}
            {payment.status === 'OVERDUE' && 'Gecikmiş'}
            {payment.status === 'CANCELLED' && 'İptal'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
          </Button>
        </div>
      </form>
    </div>
  )
}
