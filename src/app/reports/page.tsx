'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  students: {
    total: number;
    active: number;
    byGroup: Array<{ groupName: string; count: number }>;
    newThisMonth: number;
  };
  payments: {
    totalRevenue: number;
    monthlyRevenue: number;
    overdue: number;
    paidThisMonth: number;
    byMonth: Array<{ month: string; amount: number }>;
  };
  attendance: {
    averageRate: number;
    totalSessions: number;
    attendanceByGroup: Array<{ groupName: string; rate: number }>;
  };
  notifications: {
    totalSent: number;
    failureRate: number;
    byType: Array<{ type: string; count: number }>;
  };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: '30',
    groupId: '',
    reportType: 'overview'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('dateRange', filters.dateRange);
      if (filters.groupId) params.set('groupId', filters.groupId);
      
      const response = await fetch(`/api/reports/overview?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rapor verileri yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      params.set('dateRange', filters.dateRange);
      if (filters.groupId) params.set('groupId', filters.groupId);
      
      const response = await fetch(`/api/reports/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapor-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Başarılı",
          description: `Rapor ${format.toUpperCase()} olarak indirildi`,
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rapor indirilemedi",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${Math.round(rate)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Raporlar yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Raporlar ve Analitik</h1>
          <p className="text-muted-foreground">
            Okul performansı ve istatistikleri
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleExportReport('excel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel İndir
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExportReport('pdf')}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateRange">Zaman Aralığı</Label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Son 7 Gün</SelectItem>
                  <SelectItem value="30">Son 30 Gün</SelectItem>
                  <SelectItem value="90">Son 3 Ay</SelectItem>
                  <SelectItem value="365">Son 1 Yıl</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reportType">Rapor Türü</Label>
              <Select value={filters.reportType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Genel Bakış</SelectItem>
                  <SelectItem value="financial">Mali Durum</SelectItem>
                  <SelectItem value="attendance">Devam Durumu</SelectItem>
                  <SelectItem value="student">Öğrenci Analizi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Statistics */}
      {reportData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Öğrenci</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.students.total}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.students.active} aktif
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.payments.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Bu ay: {formatCurrency(reportData.payments.monthlyRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Devam Oranı</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(reportData.attendance.averageRate)}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.attendance.totalSessions} toplam antrenman
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Geciken Ödemeler</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(reportData.payments.overdue)}</div>
                <p className="text-xs text-muted-foreground">
                  Takip gerekli
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Distribution by Group */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Gruplara Göre Öğrenci Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.students.byGroup.map((group, index) => (
                    <div key={group.groupName} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: `hsl(${index * 50}, 70%, 50%)` }}
                        />
                        <span className="text-sm font-medium">{group.groupName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{group.count} öğrenci</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Aylık Gelir Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.payments.byMonth.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm">{month.month}</span>
                      <span className="text-sm font-medium">{formatCurrency(month.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attendance by Group */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Gruplara Göre Devam Oranları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.attendance.attendanceByGroup.map((group) => (
                    <div key={group.groupName} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{group.groupName}</span>
                        <span className="font-medium">{formatPercentage(group.rate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(group.rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Bildirim İstatistikleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Toplam Gönderilen</span>
                    <span className="font-medium">{reportData.notifications.totalSent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Başarısızlık Oranı</span>
                    <span className="font-medium text-red-600">{formatPercentage(reportData.notifications.failureRate)}</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Türe Göre Dağılım:</h4>
                    {reportData.notifications.byType.map((type) => (
                      <div key={type.type} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{type.type}</span>
                        <span>{type.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Özet Bilgiler</CardTitle>
              <CardDescription>
                Son {filters.dateRange} günlük aktivite özeti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">Pozitif Gelişmeler</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {reportData.students.newThisMonth} yeni öğrenci kaydı</li>
                    <li>• {formatCurrency(reportData.payments.paidThisMonth)} tahsilat</li>
                    <li>• Ortalama {formatPercentage(reportData.attendance.averageRate)} devam oranı</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-yellow-600">Dikkat Edilmesi Gerekenler</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• {formatCurrency(reportData.payments.overdue)} geciken ödeme</li>
                    <li>• %{Math.round(reportData.notifications.failureRate)} bildirim başarısızlığı</li>
                    <li>• Devam oranı düşük gruplar var</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600">Öneriler</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Geciken ödemeler için hatırlatma gönder</li>
                    <li>• Düşük devam oranlı öğrencileri takip et</li>
                    <li>• Yeni öğrenci kaydı için kampanya düşün</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </div>
  );
}