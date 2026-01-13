'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Payment, Student, FeeType, PaymentMethod, Branch, Group } from '@/types'
import { useState, useEffect, useRef } from 'react'

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
  const [branches, setBranches] = useState<Branch[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const studentDropdownRef = useRef<HTMLDivElement>(null)

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
      startDate: '',
      notes: ''
    }
  })

  // Set default start date only after mounting to avoid hydration mismatch
  useEffect(() => {
    if (!initialData && !watch('startDate')) {
      setValue('startDate', new Date().toISOString().split('T')[0])
    }
  }, [mounted, initialData, setValue, watch])

  const studentId = watch('studentId')
  const feeTypeId = watch('feeTypeId')

  const formatCurrency = (val: number) => {
    if (!mounted) return `${val} TL`;
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(val)
    } catch (e) {
      return `${val} TL`;
    }
  }

  // Filter students based on search (branch filtering is handled by API)
  let filteredStudents: Student[] = []
  try {
    filteredStudents = students.filter(student => {
      // Filter by search
      const firstName = student.firstName || ''
      const lastName = student.lastName || ''
      const fullName = `${firstName} ${lastName}`.toLowerCase()
      const searchLower = (studentSearch || '').toLowerCase()
      
      return fullName.includes(searchLower)
    })
  } catch (err) {
    console.error('[PaymentForm] Filter error:', err)
  }

  // Get selected student name for display
  const selectedStudent = students.find(s => s.id === studentId)
  const selectedStudentName = selectedStudent 
    ? `${selectedStudent.firstName} ${selectedStudent.lastName}${selectedStudent.group ? ` - ${selectedStudent.group.name}` : ''}`
    : ''

  useEffect(() => {
    fetchBranches()
    fetchFeeTypes()
    setMounted(true)
  }, [])

  // Fetch students when branch or group changes
  useEffect(() => {
    if (mounted) {
      fetchStudents(selectedBranchId, selectedGroupId)
    } else {
      // Initial fetch
      fetchStudents('all', 'all')
    }
  }, [selectedBranchId, selectedGroupId, mounted])

  // Fetch groups when branch changes
  useEffect(() => {
    if (mounted) {
      fetchGroups(selectedBranchId)
    }
  }, [selectedBranchId, mounted])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setShowStudentDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Auto-fill amount and installment count when fee type is selected
    if (feeTypeId && !initialData) {
      const selectedFeeType = feeTypes.find(ft => ft.id === feeTypeId)
      if (selectedFeeType) {
        setValue('amount', selectedFeeType.amount.toString())
        
        // Auto-calculate start date based on period
        const today = new Date()
        let calculatedStartDate = new Date(today)

        switch (selectedFeeType.period) {
          case 'MONTHLY':
            // Start from next month, first day
            calculatedStartDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
            setValue('installmentCount', '12') // 12 months
            break
          case 'QUARTERLY':
            // Start from next quarter
            calculatedStartDate.setMonth(today.getMonth() + 3)
            setValue('installmentCount', '4') // 4 quarters
            break
          case 'YEARLY':
            // Start from next year
            calculatedStartDate.setFullYear(today.getFullYear() + 1)
            setValue('installmentCount', '1') // 1 year
            break
          case 'ONE_TIME':
            // For one-time fees, set to end of current month
            calculatedStartDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            setValue('installmentCount', '1') // Single payment
            break
          default:
            setValue('installmentCount', '1')
        }

        // Set the calculated start date
        setValue('startDate', calculatedStartDate.toISOString().split('T')[0])
      }
    }
  }, [feeTypeId, feeTypes, initialData, setValue])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data)
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
    }
  }

  const fetchGroups = async (branchId?: string) => {
    try {
      const bId = branchId || selectedBranchId
      console.log(`[PaymentForm] Fetching groups for branch: ${bId}`)
      const params = new URLSearchParams()
      if (bId && bId !== 'all') {
        params.append('branchId', bId)
      }
      
      const response = await fetch(`/api/groups?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        console.log(`[PaymentForm] Fetched ${data.length} groups`)
        setGroups(data)
      } else {
        console.error('[PaymentForm] Failed to fetch groups:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    }
  }

  const fetchStudents = async (branchId?: string, groupId?: string) => {
    try {
      setLoadingData(true)
      setFetchError(null)
      const bId = branchId || selectedBranchId
      const gId = groupId || selectedGroupId
      console.log(`[PaymentForm] Fetching students (branch: ${bId}, group: ${gId})...`)
      
      const params = new URLSearchParams({
        status: 'active',
        limit: '1000',
        t: Date.now().toString()
      })
      
      // Only add branchId if it's not 'all'
      if (bId && bId !== 'all') {
        params.append('branchId', bId)
      }
      // Only add groupId if it's not 'all'
      if (gId && gId !== 'all') {
        params.append('groupId', gId)
      }

      const url = `/api/students?${params.toString()}`
      console.log(`[PaymentForm] Fetching from URL: ${url}`)
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log(`[PaymentForm] Fetched ${data.students?.length || 0} students`)
        setStudents(data.students || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setFetchError(`Öğrenciler yüklenemedi: ${response.status} ${response.statusText}`)
        console.error('[PaymentForm] Failed to fetch students:', response.status, response.statusText, errorData)
      }
    } catch (error) {
      setFetchError(`Bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
      console.error('[PaymentForm] Error fetching students:', error)
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
        {/* Branch Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="branchId" className="mb-2 block">Şube</Label>
            <Select
              value={selectedBranchId}
              onValueChange={(value) => {
                console.log('Branch changed:', value)
                setSelectedBranchId(value)
                setSelectedGroupId('all')
                setValue('studentId', '')
                setStudentSearch('')
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Şube seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şubeler</SelectItem>
                {branches.filter(b => b.isActive).map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="groupId" className="mb-2 block">Grup</Label>
            <Select
              key={`group-select-${selectedBranchId}`}
              value={selectedGroupId}
              onValueChange={(value) => {
                console.log('Group changed:', value)
                setSelectedGroupId(value)
                setValue('studentId', '')
                setStudentSearch('')
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Grup seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Gruplar</SelectItem>
                {groups && groups.length > 0 ? (
                  groups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Grup bulunamadı</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-1">
          {students.length} öğrenci listeleniyor
        </p>

        {/* Student Selection - Searchable */}
        <div className="relative" ref={studentDropdownRef}>
          <Label htmlFor="studentId">Öğrenci * {students.length > 0 && <span className="text-xs font-normal text-green-600">({students.length} öğrenci yüklendi)</span>}</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Öğrenci ara..."
              value={studentId && !showStudentDropdown ? selectedStudentName : studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value)
                setShowStudentDropdown(true)
                if (!e.target.value && studentId) {
                  setValue('studentId', '')
                }
              }}
              onFocus={() => setShowStudentDropdown(true)}
              disabled={mode === 'edit'}
              className={errors.studentId ? 'border-red-500' : ''}
            />
            {showStudentDropdown && mode !== 'edit' && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {loadingData ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Öğrenciler yükleniyor...
                  </div>
                ) : fetchError ? (
                  <div className="px-3 py-2 text-sm text-red-600">
                    {fetchError}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        fetchStudents()
                      }}
                      className="ml-2 underline text-blue-600"
                    >
                      Tekrar dene
                    </button>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setValue('studentId', student.id)
                        setStudentSearch('')
                        setShowStudentDropdown(false)
                      }}
                    >
                      <div className="font-medium">{student.firstName} {student.lastName}</div>
                      <div className="text-xs text-gray-500">
                        {student.group && <span>{student.group.name}</span>}
                        {student.branch && student.group && <span> • </span>}
                        {student.branch && <span>{student.branch.name}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Öğrenci bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>
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
                  {feeType.name} - {formatCurrency(feeType.amount)}
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
            Toplam: {formatCurrency(parseFloat(watch('amount') || '0') * parseInt(watch('installmentCount') || '1'))}
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
            <p className="text-sm text-blue-600 mt-1">
              ✓ {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'MONTHLY' && 'Her ay bir vade oluşturulacak (Otomatik: Gelecek ayın 1. günü)'}
              {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'QUARTERLY' && 'Her 3 ayda bir vade oluşturulacak (Otomatik: 3 ay sonra)'}
              {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'YEARLY' && 'Her yıl bir vade oluşturulacak (Otomatik: Gelecek yıl)'}
              {feeTypes.find(ft => ft.id === feeTypeId)?.period === 'ONE_TIME' && 'Tek seferlik ödeme oluşturulacak (Otomatik: Ay sonu)'}
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
