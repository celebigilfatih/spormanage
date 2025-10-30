'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Send, Plus, Filter, MoreVertical, Mail, MessageSquare, Smartphone, Calendar, User, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Local Textarea component to avoid import issues
const Textarea = ({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const baseClasses = "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  const combinedClasses = `${baseClasses} ${className}`.trim()
  
  return (
    <textarea
      className={combinedClasses}
      {...props}
    />
  )
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  method: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  createdAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  parents: {
    email?: string;
    phone?: string;
  }[];
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    method: 'all',
    studentId: 'all'
  });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'GENERAL_ANNOUNCEMENT',
    method: 'IN_APP',
    studentId: 'all',
    scheduledAt: '',
    recipientEmail: '',
    recipientPhone: ''
  });

  useEffect(() => {
    fetchNotifications();
    fetchStudents();
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=1000');
      const data = await response.json();
      
      if (response.ok) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setFormData({
          title: '',
          message: '',
          type: 'GENERAL_ANNOUNCEMENT',
          method: 'IN_APP',
          studentId: 'all',
          scheduledAt: '',
          recipientEmail: '',
          recipientPhone: ''
        });
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleSendNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/send`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedNotifications.length === 0) return;

    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: selectedNotifications,
          action
        })
      });

      if (response.ok) {
        setSelectedNotifications([]);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      PENDING: 'outline',
      SENT: 'default',
      FAILED: 'destructive',
      CANCELLED: 'secondary'
    };

    const icons: { [key: string]: React.ReactElement } = {
      PENDING: <Clock className="w-3 h-3" />,
      SENT: <CheckCircle className="w-3 h-3" />,
      FAILED: <XCircle className="w-3 h-3" />,
      CANCELLED: <AlertCircle className="w-3 h-3" />
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
    const icons: { [key: string]: React.ReactElement } = {
      EMAIL: <Mail className="w-4 h-4" />,
      SMS: <Smartphone className="w-4 h-4" />,
      IN_APP: <Bell className="w-4 h-4" />
    };
    return icons[method] || <MessageSquare className="w-4 h-4" />;
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      PAYMENT_REMINDER: 'Ödeme Hatırlatması',
      PAYMENT_OVERDUE: 'Geciken Ödeme',
      ATTENDANCE_REMINDER: 'Antrenman Hatırlatması',
      GENERAL_ANNOUNCEMENT: 'Genel Duyuru',
      TRAINING_CANCELLED: 'Antrenman İptali'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bildirimler</h1>
          <p className="text-gray-600">Öğrenci ve veli bildirimlerini yönetin</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Bildirim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Bildirim Oluştur</DialogTitle>
              <DialogDescription>
                Öğrenciler ve veliler için bildirim oluşturun
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e: React.FormEvent) => handleCreateNotification(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Başlık</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Öğrenci (Opsiyonel)</label>
                  <Select value={formData.studentId} onValueChange={(value) => setFormData({ ...formData, studentId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Öğrenci seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm öğrenciler</SelectItem>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Mesaj</label>
                <Textarea
                  value={formData.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Tip</label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT_REMINDER">Ödeme Hatırlatması</SelectItem>
                      <SelectItem value="PAYMENT_OVERDUE">Geciken Ödeme</SelectItem>
                      <SelectItem value="ATTENDANCE_REMINDER">Antrenman Hatırlatması</SelectItem>
                      <SelectItem value="GENERAL_ANNOUNCEMENT">Genel Duyuru</SelectItem>
                      <SelectItem value="TRAINING_CANCELLED">Antrenman İptali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Yöntem</label>
                  <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">E-posta</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="IN_APP">Uygulama İçi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Zamanlama (Opsiyonel)</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Alıcı E-posta (Opsiyonel)</label>
                  <Input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Alıcı Telefon (Opsiyonel)</label>
                  <Input
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  Oluştur
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm tipler</SelectItem>
                <SelectItem value="PAYMENT_REMINDER">Ödeme Hatırlatması</SelectItem>
                <SelectItem value="PAYMENT_OVERDUE">Geciken Ödeme</SelectItem>
                <SelectItem value="ATTENDANCE_REMINDER">Antrenman Hatırlatması</SelectItem>
                <SelectItem value="GENERAL_ANNOUNCEMENT">Genel Duyuru</SelectItem>
                <SelectItem value="TRAINING_CANCELLED">Antrenman İptali</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                <SelectItem value="PENDING">Beklemede</SelectItem>
                <SelectItem value="SENT">Gönderildi</SelectItem>
                <SelectItem value="FAILED">Başarısız</SelectItem>
                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.method} onValueChange={(value) => setFilters({ ...filters, method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Yöntem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm yöntemler</SelectItem>
                <SelectItem value="EMAIL">E-posta</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="IN_APP">Uygulama İçi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.studentId} onValueChange={(value) => setFilters({ ...filters, studentId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Öğrenci" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm öğrenciler</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedNotifications.length} bildirim seçildi
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction('send')}>
                  <Send className="w-4 h-4 mr-2" />
                  Gönder
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('cancel')}>
                  İptal Et
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                  Sil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Checkbox
                    checked={selectedNotifications.includes(notification.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedNotifications([...selectedNotifications, notification.id]);
                      } else {
                        setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                      }
                    }}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getMethodIcon(notification.method)}
                      <h3 className="font-semibold">{notification.title}</h3>
                      {getStatusBadge(notification.status)}
                      <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {notification.student && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {notification.student.firstName} {notification.student.lastName}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                      </div>
                      
                      {notification.scheduledAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Zamanlandı: {format(new Date(notification.scheduledAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </div>
                      )}
                      
                      {notification.sentAt && (
                        <div className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          Gönderildi: {format(new Date(notification.sentAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </div>
                      )}
                    </div>
                    
                    {(notification.recipientEmail || notification.recipientPhone) && (
                      <div className="mt-2 text-sm text-gray-500">
                        {notification.recipientEmail && <div>E-posta: {notification.recipientEmail}</div>}
                        {notification.recipientPhone && <div>Telefon: {notification.recipientPhone}</div>}
                      </div>
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {notification.status === 'PENDING' && (
                      <DropdownMenuItem onClick={() => handleSendNotification(notification.id)}>
                        <Send className="w-4 h-4 mr-2" />
                        Şimdi Gönder
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {notifications.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bildirim bulunamadı</h3>
              <p className="text-gray-600 mb-4">Henüz hiç bildirim oluşturulmamış.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                İlk bildirimi oluştur
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </AppLayout>
  );
}