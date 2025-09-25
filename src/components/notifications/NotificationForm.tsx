'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, MessageSquare, Calendar } from 'lucide-react';
import { NotificationType, NotificationMethod, Student, Group } from '@/types';

const notificationSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli'),
  message: z.string().min(1, 'Mesaj gerekli'),
  type: z.nativeEnum(NotificationType),
  method: z.nativeEnum(NotificationMethod),
  recipientType: z.enum(['all', 'group', 'selected', 'custom']),
  groupId: z.string().optional(),
  selectedStudents: z.array(z.string()).optional(),
  customEmail: z.string().email().optional(),
  customPhone: z.string().optional(),
  scheduledAt: z.string().optional(),
});

interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType;
  method: NotificationMethod;
  recipientType: 'all' | 'group' | 'selected' | 'custom';
  groupId?: string;
  selectedStudents?: string[];
  customEmail?: string;
  customPhone?: string;
  scheduledAt?: string;
}

interface NotificationFormProps {
  onSubmit: (data: NotificationFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NotificationForm({ onSubmit, onCancel, isLoading = false }: NotificationFormProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      recipientType: 'all',
      type: NotificationType.GENERAL_ANNOUNCEMENT,
      method: NotificationMethod.EMAIL
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (watchedValues.recipientType === 'group' && watchedValues.groupId) {
      fetchStudentsByGroup(watchedValues.groupId);
    } else if (watchedValues.recipientType === 'selected') {
      fetchAllStudents();
    }
  }, [watchedValues.recipientType, watchedValues.groupId]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.filter((g: Group) => g.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchStudentsByGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/students?groupId=${groupId}&status=active&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await fetch('/api/students?status=active&limit=500');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const getMethodIcon = (method: NotificationMethod) => {
    switch (method) {
      case NotificationMethod.EMAIL: return <Mail className="h-4 w-4" />;
      case NotificationMethod.SMS: return <MessageSquare className="h-4 w-4" />;
      case NotificationMethod.IN_APP: return <Bell className="h-4 w-4" />;
    }
  };

  const getRecipientCount = () => {
    switch (watchedValues.recipientType) {
      case 'all': return students.length || 'Tüm öğrenciler';
      case 'group': return students.length || 'Grup öğrencileri';
      case 'selected': return watchedValues.selectedStudents?.length || 0;
      case 'custom': return 1;
      default: return 0;
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Yeni Bildirim Oluştur</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">Başlık *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Bildirim başlığı"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <Label htmlFor="message">Mesaj *</Label>
          <textarea
            id="message"
            {...register('message')}
            rows={4}
            placeholder="Bildirim mesajı"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
          )}
        </div>

        {/* Type and Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Bildirim Türü *</Label>
            <Select onValueChange={(value) => setValue('type', value as NotificationType)}>
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NotificationType.GENERAL_ANNOUNCEMENT}>Genel Duyuru</SelectItem>
                <SelectItem value={NotificationType.PAYMENT_REMINDER}>Ödeme Hatırlatması</SelectItem>
                <SelectItem value={NotificationType.PAYMENT_OVERDUE}>Geciken Ödeme</SelectItem>
                <SelectItem value={NotificationType.ATTENDANCE_REMINDER}>Devamsızlık Uyarısı</SelectItem>
                <SelectItem value={NotificationType.TRAINING_CANCELLED}>Antrenman İptali</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="method">Gönderim Yöntemi *</Label>
            <Select onValueChange={(value) => setValue('method', value as NotificationMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Yöntem seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NotificationMethod.EMAIL}>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    E-posta
                  </div>
                </SelectItem>
                <SelectItem value={NotificationMethod.SMS}>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS
                  </div>
                </SelectItem>
                <SelectItem value={NotificationMethod.IN_APP}>
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    Uygulama
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <Label>Alıcılar *</Label>
          <div className="space-y-3 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="all"
                value="all"
                {...register('recipientType')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="all">Tüm Öğrenciler</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="group"
                value="group"
                {...register('recipientType')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="group">Belirli Grup</Label>
            </div>

            {watchedValues.recipientType === 'group' && (
              <div className="ml-6">
                <Select onValueChange={(value) => setValue('groupId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="selected"
                value="selected"
                {...register('recipientType')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="selected">Seçili Öğrenciler</Label>
            </div>

            {watchedValues.recipientType === 'selected' && students.length > 0 && (
              <div className="ml-6 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                <div className="space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={watchedValues.selectedStudents?.includes(student.id) || false}
                        onChange={(e) => {
                          const current = watchedValues.selectedStudents || [];
                          if (e.target.checked) {
                            setValue('selectedStudents', [...current, student.id]);
                          } else {
                            setValue('selectedStudents', current.filter(id => id !== student.id));
                          }
                        }}
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
            )}

            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="custom"
                value="custom"
                {...register('recipientType')}
                className="rounded border-gray-300"
              />
              <Label htmlFor="custom">Özel Alıcı</Label>
            </div>

            {watchedValues.recipientType === 'custom' && (
              <div className="ml-6 space-y-3">
                {watchedValues.method === NotificationMethod.EMAIL && (
                  <div>
                    <Label htmlFor="customEmail">E-posta Adresi</Label>
                    <Input
                      id="customEmail"
                      type="email"
                      {...register('customEmail')}
                      placeholder="ornek@email.com"
                    />
                  </div>
                )}
                {watchedValues.method === NotificationMethod.SMS && (
                  <div>
                    <Label htmlFor="customPhone">Telefon Numarası</Label>
                    <Input
                      id="customPhone"
                      {...register('customPhone')}
                      placeholder="+90 5XX XXX XX XX"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scheduling */}
        <div>
          <Label htmlFor="scheduledAt">Planlanan Gönderim Zamanı (İsteğe Bağlı)</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            {...register('scheduledAt')}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Boş bırakılırsa hemen gönderilir
          </p>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Özet</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              {getMethodIcon(watchedValues.method)}
              <span>Yöntem: {watchedValues.method}</span>
            </div>
            <div>Alıcı sayısı: {getRecipientCount()}</div>
            {watchedValues.scheduledAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Zamanlanmış: {new Date(watchedValues.scheduledAt).toLocaleString('tr-TR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Oluşturuluyor...' : 'Bildirim Oluştur'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}