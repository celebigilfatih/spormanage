'use client';

import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrainingForm } from '@/components/trainings/TrainingForm';
import { AttendanceTracker } from '@/components/trainings/AttendanceTracker';
import { useToast } from '@/hooks/use-toast';
import { Training } from '@/types';

// Training interface for this page
interface TrainingListItem {
  id: string;
  name: string;
  description?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location?: string;
  isActive: boolean;
  groupId: string;
  status?: string; // Additional field for UI
  group: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      students: number;
    };
  };
  _count: {
    attendances: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function TrainingsPage() {
  const [trainings, setTrainings] = useState<TrainingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [showAttendanceTracker, setShowAttendanceTracker] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingListItem | null>(null);
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
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setShowTrainingForm(false);
        fetchTrainings();
        toast({
          title: "Başarılı",
          description: "Antrenman oluşturuldu",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Antrenman oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleAttendanceSubmit = async (attendances: any[]) => {
    try {
      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingId: selectedTraining?.id, attendances }),
      });
      
      if (response.ok) {
        setShowAttendanceTracker(false);
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

  const handleAttendanceClick = (training: TrainingListItem) => {
    setSelectedTraining(training);
    setShowAttendanceTracker(true);
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAttendanceRate = (training: TrainingListItem) => {
    if (training.group._count.students === 0) return 0;
    return Math.round((training._count.attendances / training.group._count.students) * 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
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
              {Array.isArray(trainings) ? trainings.filter(t => {
                const trainingDate = new Date(t.date);
                const now = new Date();
                const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                return trainingDate >= weekStart && trainingDate < weekEnd;
              }).length : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(trainings) ? trainings.filter(t => t.status === 'COMPLETED' || !t.isActive).length : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Katılım</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(trainings) && trainings.length > 0 
                ? Math.round(trainings.reduce((acc, t) => acc + getAttendanceRate(t), 0) / trainings.length)
                : 0}%
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
              {Array.isArray(trainings) && trainings.map((training) => (
                <div
                  key={training.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{training.group.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(training.date)} • {formatTime(training.startTime)} 
                        • {Math.round((training.endTime.getTime() - training.startTime.getTime()) / (1000 * 60))} dakika
                      </div>
                      {training.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {training.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {training._count.attendances}/{training.group._count.students}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        %{getAttendanceRate(training)} katılım
                      </div>
                    </div>
                    
                    <Badge variant="outline">{training.group.description || 'Grup'}</Badge>
                    {getStatusBadge(training.status || (training.isActive ? 'SCHEDULED' : 'COMPLETED'))}

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAttendanceClick(training)}
                      >
                        Yoklama
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleAttendanceClick(training)}
                          >
                            Yoklama Al
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteTraining(training.id)}
                          >
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Form Dialog */}
      <Dialog open={showTrainingForm} onOpenChange={setShowTrainingForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Antrenman Oluştur</DialogTitle>
          </DialogHeader>
          <TrainingForm 
            onSubmit={handleTrainingSubmit}
            onCancel={() => setShowTrainingForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Attendance Tracker Dialog */}
      <Dialog open={showAttendanceTracker} onOpenChange={setShowAttendanceTracker}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Yoklama - {selectedTraining?.group.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <AttendanceTracker
              training={selectedTraining as Training}
              onSubmit={handleAttendanceSubmit}
              onCancel={() => setShowAttendanceTracker(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}