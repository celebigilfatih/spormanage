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
import { useToast } from '@/hooks/use-toast';
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

interface Group {
  id: string;
  name: string;
}

interface Trainer {
  id: string;
  name: string;
  email: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    recipientType: 'students', // students, groups, trainers
    studentId: 'all',
    groupId: 'all',
    trainerId: 'all',
    scheduledAt: '',
    recipientEmail: '',
    recipientPhone: ''
  });

  useEffect(() => {
    fetchNotifications();
    fetchStudents();
    fetchGroups();
    fetchTrainers();
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

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      
      if (response.ok) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/trainers');
      const data = await response.json();
      
      if (response.ok) {
        setTrainers(data.trainers || []);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingNotification 
        ? `/api/notifications/${editingNotification.id}` 
        : '/api/notifications';
      const method = editingNotification ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: '✅ Başarılı!',
          description: editingNotification ? 'Bildirim güncellendi' : 'Bildirim oluşturuldu'
        });
        setShowCreateDialog(false);
        setEditingNotification(null);
        setFormData({
          title: '',
          message: '',
          type: 'GENERAL_ANNOUNCEMENT',
          method: 'IN_APP',
          recipientType: 'students',
          studentId: 'all',
          groupId: 'all',
          trainerId: 'all',
          scheduledAt: '',
          recipientEmail: '',
          recipientPhone: ''
        });
        fetchNotifications();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: '❌ Hata!',
          description: error.error || 'İşlem başarısız'
        });
      }
    } catch (error) {
      console.error('Error creating/updating notification:', error);
      toast({
        variant: 'destructive',
        title: '❌ Hata!',
        description: 'İşlem sırasında bir hata oluştu'
      });
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

  const handleEditNotification = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      method: notification.method,
      recipientType: 'students',
      studentId: notification.student?.id || 'all',
      groupId: 'all',
      trainerId: 'all',
      scheduledAt: notification.scheduledAt ? new Date(notification.scheduledAt).toISOString().slice(0, 16) : '',
      recipientEmail: notification.recipientEmail || '',
      recipientPhone: notification.recipientPhone || ''
    });
    setShowCreateDialog(true);
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: '✅ Silindi!',
          description: 'Bildirim başarıyla silindi'
        });
        fetchNotifications();
      } else {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: '❌ Hata!',
          description: error.error || 'Bildirim silinemedi'
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        variant: 'destructive',
        title: '❌ Hata!',
        description: 'Bildirim silinirken bir hata oluştu'
      });
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bildirimler</h1>
          <p className="text-gray-600">Öğrenci ve veli bildirimlerini yönetin</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingNotification(null);
            setFormData({
              title: '',
              message: '',
              type: 'GENERAL_ANNOUNCEMENT',
              method: 'IN_APP',
              recipientType: 'students',
              studentId: 'all',
              groupId: 'all',
              trainerId: 'all',
              scheduledAt: '',
              recipientEmail: '',
              recipientPhone: ''
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Bildirim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNotification ? 'Bildirimi Düzenle' : 'Yeni Bildirim Oluştur'}</DialogTitle>
              <DialogDescription>
                Öğrenciler ve veliler için bildirim {editingNotification ? 'düzenleyin' : 'oluşturun'}
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
                  <label className="text-sm font-medium">Alıcı Tipi</label>
                  <Select value={formData.recipientType} onValueChange={(value) => setFormData({ ...formData, recipientType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alıcı tipi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="students">Öğrenciler</SelectItem>
                      <SelectItem value="groups">Gruplar</SelectItem>
                      <SelectItem value="trainers">Antrenörler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional recipient selection based on type */}
              {formData.recipientType === 'students' && (
                <div>
                  <label className="text-sm font-medium">Öğrenci Seçin</label>
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
              )}

              {formData.recipientType === 'groups' && (
                <div>
                  <label className="text-sm font-medium">Grup Seçin</label>
                  <Select value={formData.groupId} onValueChange={(value) => setFormData({ ...formData, groupId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grup seçin" />
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
              )}

              {formData.recipientType === 'trainers' && (
                <div>
                  <label className="text-sm font-medium">Antrenör Seçin</label>
                  <Select value={formData.trainerId} onValueChange={(value) => setFormData({ ...formData, trainerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Antrenör seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm antrenörler</SelectItem>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  setEditingNotification(null);
                }}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingNotification ? 'Güncelle' : 'Oluştur'}
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
                        {mounted ? format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: tr }) : '...'}
                      </div>
                      
                      {notification.scheduledAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Zamanlandı: {mounted ? format(new Date(notification.scheduledAt), 'dd MMM yyyy HH:mm', { locale: tr }) : '...'}
                        </div>
                      )}
                      
                      {notification.sentAt && (
                        <div className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          Gönderildi: {mounted ? format(new Date(notification.sentAt), 'dd MMM yyyy HH:mm', { locale: tr }) : '...'}
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
                    <DropdownMenuItem onClick={() => handleEditNotification(notification)}>
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
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