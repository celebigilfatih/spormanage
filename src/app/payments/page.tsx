'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { PaymentForm } from '@/components/forms/PaymentForm'
import { RecordPaymentForm } from '@/components/forms/RecordPaymentForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Calendar,
  Filter,
  Edit,
  X
} from 'lucide-react'
import { Payment, Group, FeeType, PaymentStatus, PaymentMethod, UserRole } from '@/types'
import { AuthService } from '@/lib/auth'

interface PaymentSummary {
  totalAmount: number
  totalPaid: number
  totalCount: number
  overdueCount: number
}

interface PaymentsResponse {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: PaymentSummary
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [summary, setSummary] = useState<PaymentSummary>({
    totalAmount: 0,
    totalPaid: 0,
    totalCount: 0,
    overdueCount: 0
  })
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [overdueFilter, setOverdueFilter] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Bulk operations
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManagePayments = user && AuthService.canManagePayments(user.role as UserRole)

  useEffect(() => {
    fetchPayments()
    fetchGroups()
    fetchFeeTypes()
  }, [currentPage, statusFilter, groupFilter, overdueFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: statusFilter,
        groupId: groupFilter,
        overdue: overdueFilter.toString(),
      })

      const response = await fetch(`/api/payments?${params}`)
      if (response.ok) {
        const data: PaymentsResponse = await response.json()
        setPayments(data.payments)
        setTotalPages(data.pagination.pages)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
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

  const getStatusBadge = (status: PaymentStatus) => {
    const styles = {
      [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [PaymentStatus.PARTIAL]: 'bg-blue-100 text-blue-800',
      [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
      [PaymentStatus.OVERDUE]: 'bg-red-100 text-red-800',
      [PaymentStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    }

    const labels = {
      [PaymentStatus.PENDING]: 'Bekliyor',
      [PaymentStatus.PARTIAL]: 'Kısmi',
      [PaymentStatus.PAID]: 'Ödendi',
      [PaymentStatus.OVERDUE]: 'Gecikmiş',
      [PaymentStatus.CANCELLED]: 'İptal',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const handleAddPayment = async (data: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setShowAddForm(false)
        fetchPayments()
        alert('Ödeme kaydı başarıyla oluşturuldu!')
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Ödeme oluşturulamadı'))
      }
    } catch (error) {
      alert('Ödeme kaydı oluşturulurken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPayment = async (data: any) => {
    if (!selectedPayment) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setShowEditForm(false)
        setSelectedPayment(null)
        fetchPayments()
        alert('Ödeme kaydı başarıyla güncellendi!')
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Ödeme güncellenemedi'))
      }
    } catch (error) {
      alert('Ödeme güncellenirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecordPayment = async (data: any) => {
    if (!selectedPayment) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_payment',
          ...data
        })
      })

      if (response.ok) {
        setShowRecordForm(false)
        setSelectedPayment(null)
        fetchPayments()
        alert('Ödeme başarıyla kaydedildi!')
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Ödeme kaydedilemedi'))
      }
    } catch (error) {
      alert('Ödeme kaydedilirken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkCollection = async () => {
    if (!selectedPayments.length) return

    try {
      const response = await fetch('/api/payments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_collect',
          paymentIds: selectedPayments,
          paymentMethod: PaymentMethod.CASH
        }),
      })

      if (response.ok) {
        setSelectedPayments([])
        setShowBulkActions(false)
        fetchPayments()
        // TODO: Show success toast
      }
    } catch (error) {
      console.error('Failed to process bulk collection:', error)
      // TODO: Show error toast
    }
  }

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    )
  }

  const selectAllPayments = () => {
    const pendingPayments = payments
      .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PARTIAL)
      .map(p => p.id)
    setSelectedPayments(pendingPayments)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const isOverdue = (payment: Payment) => {
    return (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PARTIAL) &&
           new Date(payment.dueDate) < new Date()
  }

  // Show forms
  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => setShowAddForm(false)}
            className="mb-4"
          >
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          <PaymentForm
            onSubmit={handleAddPayment}
            onCancel={() => setShowAddForm(false)}
            isLoading={isSubmitting}
            mode="create"
          />
        </div>
      </div>
    )
  }

  if (showEditForm && selectedPayment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => {
              setShowEditForm(false)
              setSelectedPayment(null)
            }}
            className="mb-4"
          >
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          <PaymentForm
            onSubmit={handleEditPayment}
            onCancel={() => {
              setShowEditForm(false)
              setSelectedPayment(null)
            }}
            isLoading={isSubmitting}
            initialData={selectedPayment}
            mode="edit"
          />
        </div>
      </div>
    )
  }

  if (showRecordForm && selectedPayment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => {
              setShowRecordForm(false)
              setSelectedPayment(null)
            }}
            className="mb-4"
          >
            <X className="h-4 w-4 mr-2" />
            İptal
          </Button>
          <RecordPaymentForm
            payment={selectedPayment}
            onSubmit={handleRecordPayment}
            onCancel={() => {
              setShowRecordForm(false)
              setSelectedPayment(null)
            }}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ödemeler</h1>
              <p className="text-gray-600">
                Öğrenci aidatlarını ve ödeme takibini yönetin
              </p>
            </div>
            {canManagePayments && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/payments/bulk')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Toplu İşlemler
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ödeme Ekle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalPaid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalAmount - summary.totalPaid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.overdueCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.totalCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={PaymentStatus.PARTIAL}>Partial</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={PaymentStatus.OVERDUE}>Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group
              </label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm gruplar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="overdue"
                  checked={overdueFilter}
                  onChange={(e) => setOverdueFilter(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="overdue" className="text-sm font-medium text-gray-700">
                  Show overdue only
                </label>
              </div>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setStatusFilter('all')
                  setGroupFilter('all')
                  setOverdueFilter(false)
                  setCurrentPage(1)
                }}
                variant="outline"
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && canManagePayments && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedPayments.length} payments selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllPayments}
                >
                  Select All Pending
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleBulkCollection}
                  disabled={!selectedPayments.length}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark as Paid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPayments([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payments List */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-lg text-gray-600">Loading payments...</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg text-gray-600 mb-2">No payments found</div>
              <p className="text-gray-500">
                Try adjusting your filters or create new payment records
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {showBulkActions && canManagePayments && (
                        payment.status !== PaymentStatus.PAID && 
                        payment.status !== PaymentStatus.CANCELLED
                      ) && (
                        <input
                          type="checkbox"
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => togglePaymentSelection(payment.id)}
                          className="mt-1 rounded border-gray-300"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">
                            {payment.student?.firstName} {payment.student?.lastName}
                          </h3>
                          {getStatusBadge(payment.status)}
                          {isOverdue(payment) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Fee Type</p>
                            <p className="text-sm text-gray-900">{payment.feeType?.name}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-600">Amount</p>
                            <p className="text-sm text-gray-900">
                              {formatCurrency(payment.paidAmount || 0)} / {formatCurrency(payment.amount)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-gray-600">Due Date</p>
                            <p className="text-sm text-gray-900">
                              {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {payment.student?.group && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {payment.student.group.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {canManagePayments && (
                      <div className="flex space-x-2">
                        {(payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PARTIAL) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowRecordForm(true)
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Ödeme Kaydet
                          </Button>
                        )}
                        {payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.CANCELLED && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowEditForm(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Düzenle
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages, currentPage - 2 + i))
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}