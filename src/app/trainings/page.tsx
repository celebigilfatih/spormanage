'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Clock, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrainingForm } from '@/components/trainings/TrainingForm';
import { AttendanceTracker } from '@/components/trainings/AttendanceTracker';
import { useToast } from '@/hooks/use-toast';

// Training interface for new session-based model
interface TrainingSession {
  id: string;
  trainingId: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  notes?: string;
  isCancelled: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  _count: {
    attendances: number;
  };
}

interface TrainingListItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  groupId: string;
  group: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    _count: {
      students: number;
    };
  };
  sessions: TrainingSession[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<TrainingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<TrainingListItem | null>(null);
  const [showAttendanceTracker, setShowAttendanceTracker] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession & { training: TrainingListItem } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch('/api/trainings');
      if (response.ok) {
        const data = await response.json();
        // Extract trainings array from API response
        const trainingsArray = data.trainings || data;
        // Ensure data is always an array
        setTrainings(Array.isArray(trainingsArray) ? trainingsArray : []);
      } else {
        // If response is not ok, set empty array
        setTrainings([]);
      }
    } catch (error) {
      // On error, ensure trainings is an empty array
      setTrainings([]);
      toast({
        title: "Hata",
        description: "Antrenmanlar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingSubmit = async (data: any) => {
    try {
      const isEditing = !!editingTraining;
      const url = isEditing ? `/api/trainings/${editingTraining.id}` : '/api/trainings';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setShowTrainingForm(false);
        setEditingTraining(null);
        fetchTrainings();
        toast({
          title: "Başarılı",
          description: isEditing ? "Antrenman güncellendi" : "Antrenman oluşturuldu",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "İşlem tamamlanamadı",
        variant: "destructive",
      });
    }
  };

  const handleAttendanceSubmit = async (attendances: any[]) => {
    try {
      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendances),
      });
      
      if (response.ok) {
        setShowAttendanceTracker(false);
        setSelectedSession(null);
        fetchTrainings();
        toast({
          title: "Başarılı",
          description: "Yoklama kaydedildi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yoklama kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const handleAttendanceClick = (session: TrainingSession, training: TrainingListItem) => {
    setSelectedSession({
      ...session,
      training: training
    } as any);
    setShowAttendanceTracker(true);
  };

  const handleEditTraining = (training: TrainingListItem) => {
    setEditingTraining(training);
    setShowTrainingForm(true);
  };

  const handleDeleteTraining = async (trainingId: string) => {
    if (!confirm('Bu antrenmanı silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/trainings/${trainingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTrainings();
        toast({
          title: "Başarılı",
          description: "Antrenman silindi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Antrenman silinemedi",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { label: 'Planlandı', variant: 'default' as const },
      COMPLETED: { label: 'Tamamlandı', variant: 'secondary' as const },
      CANCELLED: { label: 'İptal Edildi', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAttendanceRate = (session: TrainingSession, training: TrainingListItem) => {
    if (training.group._count.students === 0) return 0;
    return Math.round((session._count.attendances / training.group._count.students) * 100);
  };

  const getNextSession = (training: TrainingListItem) => {
    const now = new Date();
    const upcomingSessions = training.sessions
      .filter(s => new Date(s.date) >= now && !s.isCancelled)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcomingSessions[0] || null;
  };

  const getCompletedSessionsCount = (training: TrainingListItem) => {
    const now = new Date();
    return training.sessions.filter(s => new Date(s.date) < now).length;
  };

  const getTotalSessionsCount = (training: TrainingListItem) => {
    return training.sessions.length;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Yükleniyor...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show attendance tracker as full page
  if (showAttendanceTracker && selectedSession) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                Yoklama - {selectedSession.training.name}
              </h1>
              <p className="text-muted-foreground">
                {selectedSession.training.group.name} • {formatDate(selectedSession.date)} {formatTime(selectedSession.startTime)}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAttendanceTracker(false);
                setSelectedSession(null);
              }}
            >
              İptal
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <AttendanceTracker
                session={selectedSession as any}
                onSubmit={handleAttendanceSubmit}
                onCancel={() => {
                  setShowAttendanceTracker(false);
                  setSelectedSession(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Show training form as full page
  if (showTrainingForm) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                {editingTraining ? 'Antrenmanı Düzenle' : 'Yeni Antrenman Oluştur'}
              </h1>
              <p className="text-muted-foreground">
                Antrenman detaylarını girin ve seansları planlayın
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTrainingForm(false);
                setEditingTraining(null);
              }}
            >
              İptal
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Antrenman</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Array.isArray(trainings) ? trainings.length : 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bu Hafta</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(trainings) ? trainings.reduce((count, t) => {
                    const now = new Date();
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return count + t.sessions.filter(s => {
                      const sessionDate = new Date(s.date);
                      return sessionDate >= weekStart && sessionDate < weekEnd;
                    }).length;
                  }, 0) : 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tamamlanan Seanslar</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(trainings) ? trainings.reduce((count, t) => count + getCompletedSessionsCount(t), 0) : 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Seans</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(trainings) ? trainings.reduce((count, t) => count + getTotalSessionsCount(t), 0) : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Training Form in Card */}
          <Card>
            <CardContent className="pt-6">
              <TrainingForm 
                training={editingTraining}
                onSubmit={handleTrainingSubmit}
                onCancel={() => {
                  setShowTrainingForm(false);
                  setEditingTraining(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Antrenman Yönetimi</h1>
            <p className="text-muted-foreground">
              Antrenmanları planlayın ve yoklama alın
            </p>
          </div>
          <Button onClick={() => setShowTrainingForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Antrenman
          </Button>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Antrenman</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(trainings) ? trainings.length : 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Hafta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(trainings) ? trainings.reduce((count, t) => {
                const now = new Date();
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                return count + (t.sessions || []).filter(s => {
                  const sessionDate = new Date(s.date);
                  return sessionDate >= weekStart && sessionDate < weekEnd;
                }).length;
              }, 0) : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Seanslar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(trainings) ? trainings.reduce((count, t) => count + (t.sessions || []).length, 0) : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(trainings) ? trainings.filter(t => t.isActive).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainings List */}
      <Card>
        <CardHeader>
          <CardTitle>Antrenmanlar</CardTitle>
          <CardDescription>
            Planlanan ve geçmiş antrenmanlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(trainings) || trainings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz antrenman yok</h3>
              <p className="text-muted-foreground mb-4">
                İlk antrenmanınızı oluşturmak için başlayın
              </p>
              <Button onClick={() => setShowTrainingForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Antrenman Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(trainings) && trainings.map((training) => {
                const nextSession = getNextSession(training);
                const completedCount = getCompletedSessionsCount(training);
                const totalCount = getTotalSessionsCount(training);
                
                return (
                <div
                  key={training.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-lg">{training.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {training.group.name} • {totalCount} seans ({completedCount} tamamlandı)
                      </div>
                      {training.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {training.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={training.isActive ? "default" : "secondary"}>
                        {training.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditTraining(training)}
                          >
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteTraining(training.id)}
                          >
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Sessions List */}
                  {training.sessions && training.sessions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Seanslar:</h4>
                      <div className="space-y-2">
                        {training.sessions.slice(0, 3).map((session) => {
                          const isPast = new Date(session.date) < new Date();
                          const attendanceRate = getAttendanceRate(session, training);
                          
                          return (
                            <div
                              key={session.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {formatDate(session.date)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                    {session.location && ` • ${session.location}`}
                                  </div>
                                </div>
                                {session.isCancelled && (
                                  <Badge variant="destructive">İptal</Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {isPast && !session.isCancelled && (
                                  <div className="text-center text-sm">
                                    <div className="font-medium">
                                      {session._count.attendances}/{training.group._count.students}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      %{attendanceRate}
                                    </div>
                                  </div>
                                )}
                                
                                {!session.isCancelled && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAttendanceClick(session, training)}
                                  >
                                    Yoklama
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {training.sessions.length > 3 && (
                          <div className="text-sm text-muted-foreground text-center pt-2">
                            +{training.sessions.length - 3} seans daha
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(!training.sessions || training.sessions.length === 0) && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Henüz seans eklenmemiş
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
