'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, CreditCard, Calendar } from 'lucide-react'
import { FeeType, Group, Student } from '@/types'

const bulkChargeSchema = z.object({
  feeTypeId: z.string().min(1, 'Fee type is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  amount: z.string().optional(),
  groupId: z.string().optional(),
  selectedStudents: z.array(z.string()).optional(),
  chargeType: z.enum(['all_in_group', 'selected_students']),
})

interface BulkChargeData {
  feeTypeId: string
  dueDate: string
  amount?: string
  groupId?: string
  selectedStudents?: string[]
  chargeType: 'all_in_group' | 'selected_students'
}

interface BulkChargeFormProps {
  onSubmit: (data: BulkChargeData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function BulkChargeForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: BulkChargeFormProps) {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BulkChargeData>({
    resolver: zodResolver(bulkChargeSchema),
    defaultValues: {
      chargeType: 'all_in_group'
    }
  })

  const watchedValues = watch()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (watchedValues.groupId && watchedValues.chargeType === 'selected_students') {
      fetchStudentsInGroup(watchedValues.groupId)
    }
  }, [watchedValues.groupId, watchedValues.chargeType])

  useEffect(() => {
    if (watchedValues.feeTypeId) {
      const feeType = feeTypes.find(ft => ft.id === watchedValues.feeTypeId)
      setSelectedFeeType(feeType || null)
      if (feeType) {
        setValue('amount', feeType.amount.toString())
      }
    }
  }, [watchedValues.feeTypeId, feeTypes, setValue])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)
      const [feeTypesResponse, groupsResponse] = await Promise.all([
        fetch('/api/fee-types'),
        fetch('/api/groups')
      ])

      if (feeTypesResponse.ok) {
        const feeTypesData = await feeTypesResponse.json()
        setFeeTypes(feeTypesData)
      }

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setGroups(groupsData)
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchStudentsInGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/students?groupId=${groupId}&status=active&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleFormSubmit = async (data: BulkChargeData) => {
    await onSubmit(data)
  }

  if (loadingData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Bulk Charge</h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Fee Type Selection */}
        <div>
          <Label htmlFor="feeTypeId">Fee Type *</Label>
          <Select onValueChange={(value) => setValue('feeTypeId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select fee type" />
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
            <p className="text-red-500 text-sm mt-1">{errors.feeTypeId.message}</p>
          )}
        </div>

        {/* Amount Override */}
        {selectedFeeType && (
          <div>
            <Label htmlFor="amount">Amount (override default)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount')}
              placeholder={`Default: ${selectedFeeType.amount}`}
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to use default amount: {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              }).format(selectedFeeType.amount)}
            </p>
          </div>
        )}

        {/* Due Date */}
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            {...register('dueDate')}
            className={errors.dueDate ? 'border-red-500' : ''}
          />
          {errors.dueDate && (
            <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
          )}
        </div>

        {/* Charge Type */}
        <div>
          <Label>Charge Target</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="all_in_group"
                value="all_in_group"
                {...register('chargeType')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="all_in_group" className="text-sm">
                All active students in selected group
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="selected_students"
                value="selected_students"
                {...register('chargeType')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="selected_students" className="text-sm">
                Specific students only
              </Label>
            </div>
          </div>
        </div>

        {/* Group Selection */}
        <div>
          <Label htmlFor="groupId">
            Group {watchedValues.chargeType === 'all_in_group' ? '*' : '(for filtering)'}
          </Label>
          <Select onValueChange={(value) => setValue('groupId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} {group.description && `- ${group.description}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {watchedValues.chargeType === 'all_in_group' && !watchedValues.groupId && (
            <p className="text-red-500 text-sm mt-1">Group is required for group charging</p>
          )}
        </div>

        {/* Student Selection (for specific students) */}
        {watchedValues.chargeType === 'selected_students' && students.length > 0 && (
          <div>
            <Label>Select Students</Label>
            <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
              <div className="space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`student-${student.id}`}
                      value={student.id}
                      {...register('selectedStudents')}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`student-${student.id}`} className="text-sm">
                      {student.firstName} {student.lastName}
                      {student.group && (
                        <span className="text-gray-500 ml-2">({student.group.name})</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {watchedValues.selectedStudents?.length === 0 && (
              <p className="text-red-500 text-sm mt-1">Select at least one student</p>
            )}
          </div>
        )}

        {/* Preview */}
        {(watchedValues.feeTypeId && watchedValues.dueDate && 
          ((watchedValues.chargeType === 'all_in_group' && watchedValues.groupId) ||
           (watchedValues.chargeType === 'selected_students' && watchedValues.selectedStudents?.length))) && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
            <div className="text-sm text-blue-800">
              <p>Fee Type: {selectedFeeType?.name}</p>
              <p>
                Amount: {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                }).format(parseFloat(watchedValues.amount || selectedFeeType?.amount.toString() || '0'))}
              </p>
              <p>Due Date: {new Date(watchedValues.dueDate).toLocaleDateString()}</p>
              {watchedValues.chargeType === 'all_in_group' && watchedValues.groupId && (
                <p>Target: All active students in {groups.find(g => g.id === watchedValues.groupId)?.name}</p>
              )}
              {watchedValues.chargeType === 'selected_students' && (
                <p>Target: {watchedValues.selectedStudents?.length} selected students</p>
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
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Processing...' : 'Create Charges'}
          </Button>
        </div>
      </form>
    </div>
  )
}