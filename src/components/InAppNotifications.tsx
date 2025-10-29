'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Bell, X, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface InAppNotificationsProps {
  userId?: string;
  studentId?: string;
}

export default function InAppNotifications({ userId, studentId }: InAppNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [studentId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        method: 'IN_APP',
        status: 'SENT',
        limit: '20'
      });

      if (studentId) {
        params.append('studentId', studentId);
      }

      const response = await fetch(`/api/notifications?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - user might not be logged in
          console.warn('Unauthorized access to notifications');
          setNotifications([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.notifications) {
        setNotifications(data.notifications);
        // For demo purposes, assume first 3 are unread
        setUnreadCount(Math.min(3, data.notifications.length));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show error to user, just silently fail
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    // In a real implementation, you would call an API to mark as read
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      PAYMENT_REMINDER: 'bg-orange-100 text-orange-800 border-orange-200',
      PAYMENT_OVERDUE: 'bg-red-100 text-red-800 border-red-200',
      ATTENDANCE_REMINDER: 'bg-blue-100 text-blue-800 border-blue-200',
      GENERAL_ANNOUNCEMENT: 'bg-purple-100 text-purple-800 border-purple-200',
      TRAINING_CANCELLED: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_REMINDER':
      case 'PAYMENT_OVERDUE':
        return <AlertCircle className="w-4 h-4" />;
      case 'ATTENDANCE_REMINDER':
        return <Calendar className="w-4 h-4" />;
      case 'TRAINING_CANCELLED':
        return <X className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Bildirimler</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Tümünü okundu işaretle
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification, index) => {
                const isUnread = index < unreadCount;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isUnread ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (isUnread) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium truncate ${
                            isUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          {isUnread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.createdAt), 'dd MMM HH:mm', { locale: tr })}
                          </span>
                        </div>
                        
                        {notification.student && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            {notification.student.firstName} {notification.student.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Henüz bildirim yok</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => {
              setIsOpen(false);
              // Navigate to notifications page
              window.location.href = '/notifications';
            }}>
              Tüm bildirimleri görüntüle
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}