'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
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
  X,
  Trash2
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

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Bu ödeme kaydını silmek istediğinizden emin misiniz? Ödeme iptal edilecek ve listeden kaldırılacak.')) {
      return
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPayments()
        alert('Ödeme kaydı başarıyla silindi ve iptal edildi!')
      } else {
        const error = await response.json()
        alert('Hata: ' + (error.error || 'Ödeme silinemedi'))
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Ödeme silinirken bir hata oluştu')
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
      <AppLayout>
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
      </AppLayout>
    )
  }

  if (showEditForm && selectedPayment) {
    return (
      <AppLayout>
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
      </AppLayout>
    )
  }

  if (showRecordForm && selectedPayment) {
    return (
      <AppLayout>
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
      </AppLayout>
    )
  }

  return (
    <AppLayout>
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
                <p className="text-sm font-medium text-gray-600">Gecikmiş</p>
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
                <p className="text-sm font-medium text-gray-600">Toplam Ödeme</p>
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
                Durum
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm durumlar</SelectItem>
                  <SelectItem value={PaymentStatus.PENDING}>Bekliyor</SelectItem>
                  <SelectItem value={PaymentStatus.PARTIAL}>Kısmi</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Ödendi</SelectItem>
                  <SelectItem value={PaymentStatus.OVERDUE}>Gecikmiş</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grup
              </label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm gruplar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm gruplar</SelectItem>
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
                  Sadece gecikmişleri göster
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
                Filtreleri Sıfırla
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
                  {selectedPayments.length} ödeme seçildi
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllPayments}
                >
                  Tüm Bekleyenleri Seç
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleBulkCollection}
                  disabled={!selectedPayments.length}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Ödendi Olarak İşaretle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPayments([])}
                >
                  Seçimi Temizle
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-lg text-gray-600">Ödemeler yükleniyor...</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg text-gray-600 mb-2">Ödeme bulunamadı</div>
              <p className="text-gray-500">
                Filtrelerinizi ayarlayın veya yeni ödeme kaydı oluşturun
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {showBulkActions && canManagePayments && (
                      <th scope="col" className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllPayments()
                            } else {
                              setSelectedPayments([])
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öğrenci
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ücret Tipi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grup
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutar
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ödenen
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kalan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vade Tarihi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      {showBulkActions && canManagePayments && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.CANCELLED) ? (
                            <input
                              type="checkbox"
                              checked={selectedPayments.includes(payment.id)}
                              onChange={() => togglePaymentSelection(payment.id)}
                              className="rounded border-gray-300"
                            />
                          ) : null}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.student?.firstName} {payment.student?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.feeType?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.student?.group ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {payment.student.group.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.paidAmount ? formatCurrency(payment.paidAmount) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.paidAmount ? formatCurrency(payment.amount - (payment.paidAmount || 0)) : formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-900">
                            {new Date(payment.dueDate).toLocaleDateString('tr-TR')}
                          </div>
                          {isOverdue(payment) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {(payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PARTIAL) && canManagePayments && (
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
                          {canManagePayments && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment)
                                  setShowEditForm(true)
                                }}
                                title="Düzenle"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeletePayment(payment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  Önceki
                </Button>
                
                <div className="flex space-x-2">
                  {(() => {
                    const pages = []
                    const maxPages = Math.min(5, totalPages)
                    
                    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
                    let endPage = Math.min(totalPages, startPage + maxPages - 1)
                    
                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxPages) {
                      startPage = Math.max(1, endPage - maxPages + 1)
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                        >
                          {i}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}