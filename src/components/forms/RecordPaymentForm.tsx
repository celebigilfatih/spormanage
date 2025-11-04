'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Payment, PaymentMethod } from '@/types'

const recordPaymentSchema = z.object({
  paidAmount: z.string().min(1, 'Ödeme tutarı zorunludur'),
  paymentMethod: z.string().min(1, 'Ödeme yöntemi seçimi zorunludur'),
  paidDate: z.string().min(1, 'Ödeme tarihi zorunludur'),
  notes: z.string().optional()
})

type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>

interface RecordPaymentFormProps {
  payment: Payment
  onSubmit: (data: RecordPaymentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function RecordPaymentForm({ 
  payment,
  onSubmit, 
  onCancel, 
  isLoading = false
}: RecordPaymentFormProps) {
  const remainingAmount = payment.amount - (payment.paidAmount || 0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      paidAmount: remainingAmount.toString(),
      paymentMethod: PaymentMethod.CASH,
      paidDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
  })

  const paymentMethod = watch('paymentMethod')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Ödeme Kaydet</h2>

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
          <span className="font-medium">Toplam Tutar:</span>
          <span className="font-bold">{formatCurrency(payment.amount)}</span>
        </div>
        {payment.paidAmount && payment.paidAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="font-medium">Ödenen:</span>
            <span className="font-bold">{formatCurrency(payment.paidAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-blue-600 pt-2 border-t">
          <span className="font-medium">Kalan Tutar:</span>
          <span className="font-bold">{formatCurrency(remainingAmount)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Payment Amount */}
        <div>
          <Label htmlFor="paidAmount">Ödeme Tutarı (₺) *</Label>
          <Input
            id="paidAmount"
            type="number"
            step="0.01"
            {...register('paidAmount')}
            className={errors.paidAmount ? 'border-red-500' : ''}
            placeholder="0.00"
          />
          {errors.paidAmount && (
            <p className="text-sm text-red-600 mt-1">{errors.paidAmount.message}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Maksimum: {formatCurrency(remainingAmount)}
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <Label htmlFor="paymentMethod">Ödeme Yöntemi *</Label>
          <Select
            value={paymentMethod}
            onValueChange={(value) => setValue('paymentMethod', value)}
          >
            <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''}>
              <SelectValue placeholder="Ödeme yöntemi seçin..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PaymentMethod.CASH}>Nakit</SelectItem>
              <SelectItem value={PaymentMethod.CREDIT_CARD}>Kredi Kartı</SelectItem>
              <SelectItem value={PaymentMethod.BANK_TRANSFER}>Banka Transferi</SelectItem>
              <SelectItem value={PaymentMethod.CHEQUE}>Çek</SelectItem>
            </SelectContent>
          </Select>
          {errors.paymentMethod && (
            <p className="text-sm text-red-600 mt-1">{errors.paymentMethod.message}</p>
          )}
        </div>

        {/* Payment Date */}
        <div>
          <Label htmlFor="paidDate">Ödeme Tarihi *</Label>
          <Input
            id="paidDate"
            type="date"
            {...register('paidDate')}
            className={errors.paidDate ? 'border-red-500' : ''}
          />
          {errors.paidDate && (
            <p className="text-sm text-red-600 mt-1">{errors.paidDate.message}</p>
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
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
