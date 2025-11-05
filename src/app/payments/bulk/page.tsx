'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  CreditCard, 
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Group, FeeType, Student, PaymentMethod, UserRole } from '@/types'
import { AuthService } from '@/lib/auth'

export default function BulkPaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'charge' | 'collect'>('charge')
  
  // Bulk Charge State
  const [groups, setGroups] = useState<Group[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedFeeType, setSelectedFeeType] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  // Bulk Collect State
  const [collectDate, setCollectDate] = useState(new Date().toISOString().split('T')[0])
  const [collectMethod, setCollectMethod] = useState(PaymentMethod.CASH)
  const [collectNotes, setCollectNotes] = useState('')
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const canManagePayments = user && AuthService.canManagePayments(user.role as UserRole)

  useEffect(() => {
    if (!canManagePayments) {
      router.push('/payments')
      return
    }
    
    fetchGroups()
    fetchFeeTypes()
    fetchPendingPayments()
  }, [canManagePayments])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupStudents(selectedGroup)
    } else {
      setStudents([])
      setSelectedStudents([])
    }
  }, [selectedGroup])

  // Auto-calculate due date when fee type is selected
  useEffect(() => {
    if (selectedFeeType) {
      const feeType = feeTypes.find(ft => ft.id === selectedFeeType)
      if (feeType) {
        const today = new Date()
        let calculatedDueDate = new Date(today)

        switch (feeType.period) {
          case 'MONTHLY':
            calculatedDueDate.setMonth(today.getMonth() + 1)
            break
          case 'QUARTERLY':
            calculatedDueDate.setMonth(today.getMonth() + 3)
            break
          case 'YEARLY':
            calculatedDueDate.setFullYear(today.getFullYear() + 1)
            break
          case 'ONE_TIME':
            // For one-time fees, set to end of current month
            calculatedDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            break
        }

        setDueDate(calculatedDueDate.toISOString().split('T')[0])
      }
    }
  }, [selectedFeeType, feeTypes])

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

  const fetchGroupStudents = async (groupId: string) => {
    try {
      const response = await fetch(`/api/students?groupId=${groupId}&status=active&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch('/api/payments?status=PENDING&limit=1000')
      if (response.ok) {
        const data = await response.json()
        setPendingPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Failed to fetch pending payments:', error)
    }
  }

  const handleBulkCharge = async () => {
    if (!selectedFeeType || !dueDate || selectedStudents.length === 0) {
      setResult({
        success: false,
        message: 'Lütfen ücret tipi, vade tarihi ve en az bir öğrenci seçin'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/payments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_charge',
          feeTypeId: selectedFeeType,
          studentIds: selectedStudents,
          amount: customAmount ? parseFloat(customAmount) : undefined,
          dueDate: dueDate
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `${data.count} öğrenci için ödeme kaydı oluşturuldu`
        })
        // Reset form
        setSelectedStudents([])
        setSelectedFeeType('')
        setCustomAmount('')
        setDueDate('')
      } else {
        setResult({
          success: false,
          message: data.error || 'Toplu borçlandırma başarısız oldu'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Bir hata oluştu'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkCollect = async () => {
    if (selectedPayments.length === 0) {
      setResult({
        success: false,
        message: 'Lütfen en az bir ödeme seçin'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/payments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_collect',
          paymentIds: selectedPayments,
          collectionDate: collectDate,
          paymentMethod: collectMethod,
          notes: collectNotes
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `${data.count} ödeme başarıyla tahsil edildi`
        })
        // Reset and refresh
        setSelectedPayments([])
        setCollectNotes('')
        fetchPendingPayments()
      } else {
        setResult({
          success: false,
          message: data.error || 'Toplu tahsilat başarısız oldu'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Bir hata oluştu'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    )
  }

  const selectAllStudents = () => {
    setSelectedStudents(students.map(s => s.id))
  }

  const selectAllPayments = () => {
    setSelectedPayments(pendingPayments.map(p => p.id))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  if (!canManagePayments) {
    return null
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Toplu İşlemler</h1>
          <p className="text-gray-600">Çoklu öğrenciler için toplu borçlandırma ve tahsilat</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('charge')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'charge'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="inline h-5 w-5 mr-2" />
                Toplu Borçlandırma
              </button>
              <button
                onClick={() => setActiveTab('collect')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'collect'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="inline h-5 w-5 mr-2" />
                Toplu Tahsilat
              </button>
            </nav>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`mx-6 mt-6 p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </span>
              </div>
            </div>
          )}

          {/* Bulk Charge Tab */}
          {activeTab === 'charge' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Settings */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Borçlandırma Ayarları</CardTitle>
                      <CardDescription>
                        Toplu borçlandırma için parametreleri belirleyin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="group">Grup Seç</Label>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="Grup seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name} ({group._count?.students || 0} öğrenci)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="feeType">Ücret Tipi *</Label>
                        <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                          <SelectTrigger>
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
                      </div>

                      <div>
                        <Label htmlFor="customAmount">Özel Tutar (İsteğe Bağlı)</Label>
                        <Input
                          id="customAmount"
                          type="number"
                          step="0.01"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Varsayılan tutarı kullan"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Boş bırakırsanız ücret tipinin varsayılan tutarı kullanılır
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="dueDate">Vade Tarihi *</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                        {selectedFeeType && dueDate && (
                          <p className="text-xs text-blue-600 mt-1">
                            ✓ Otomatik olarak {feeTypes.find(ft => ft.id === selectedFeeType)?.period === 'MONTHLY' ? 'aylık' :
                              feeTypes.find(ft => ft.id === selectedFeeType)?.period === 'QUARTERLY' ? 'çeyrek yıllık' :
                              feeTypes.find(ft => ft.id === selectedFeeType)?.period === 'YEARLY' ? 'yıllık' : 'tek seferlik'} periyoda göre ayarlandı
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleBulkCharge}
                        disabled={loading || !selectedFeeType || !dueDate || selectedStudents.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? 'İşleniyor...' : `${selectedStudents.length} Öğrenci için Borçlandır`}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Student Selection */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Öğrenci Seçimi</CardTitle>
                      <CardDescription>
                        Borçlandırılacak öğrencileri seçin ({selectedStudents.length} seçili)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {students.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>Önce bir grup seçin</p>
                        </div>
                      ) : (
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllStudents}
                            className="mb-4"
                          >
                            Tümünü Seç
                          </Button>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {students.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(student.id)}
                                  onChange={() => toggleStudentSelection(student.id)}
                                  className="rounded border-gray-300"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  {student.phone && (
                                    <p className="text-sm text-gray-500">{student.phone}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Collect Tab */}
          {activeTab === 'collect' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Collection Settings */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tahsilat Ayarları</CardTitle>
                      <CardDescription>
                        Toplu tahsilat için parametreleri belirleyin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="collectDate">Tahsilat Tarihi</Label>
                        <Input
                          id="collectDate"
                          type="date"
                          value={collectDate}
                          onChange={(e) => setCollectDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="collectMethod">Ödeme Yöntemi</Label>
                        <Select value={collectMethod} onValueChange={(value: PaymentMethod) => setCollectMethod(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PaymentMethod.CASH}>Nakit</SelectItem>
                            <SelectItem value={PaymentMethod.CREDIT_CARD}>Kredi Kartı</SelectItem>
                            <SelectItem value={PaymentMethod.BANK_TRANSFER}>Banka Transferi</SelectItem>
                            <SelectItem value={PaymentMethod.CHEQUE}>Çek</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="collectNotes">Notlar</Label>
                        <Textarea
                          id="collectNotes"
                          value={collectNotes}
                          onChange={(e) => setCollectNotes(e.target.value)}
                          placeholder="Toplu tahsilat notu..."
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleBulkCollect}
                        disabled={loading || selectedPayments.length === 0}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {loading ? 'İşleniyor...' : `${selectedPayments.length} Ödeme Tahsil Et`}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Payment Selection */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Bekleyen Ödemeler</CardTitle>
                      <CardDescription>
                        Tahsil edilecek ödemeleri seçin ({selectedPayments.length} seçili)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pendingPayments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>Bekleyen ödeme bulunamadı</p>
                        </div>
                      ) : (
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllPayments}
                            className="mb-4"
                          >
                            Tümünü Seç
                          </Button>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {pendingPayments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPayments.includes(payment.id)}
                                  onChange={() => togglePaymentSelection(payment.id)}
                                  className="rounded border-gray-300"
                                />
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {payment.student?.firstName} {payment.student?.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {payment.feeType?.name}
                                  </p>
                                  <p className="text-sm font-semibold text-blue-600">
                                    {formatCurrency(payment.amount)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
