'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Users, 
  Clock,
  UserCheck,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { AttendanceTracker } from '@/components/trainings/AttendanceTracker';
import { useToast } from '@/hooks/use-toast';

interface Training {
  id: string;
  name: string;
  description?: string;
  groupId: string;
  group: {
    id: string;
    name: string;
    _count: {
      students: number;
    };
  };
  sessions: TrainingSession[];
}

interface TrainingSession {
  id: string;
  trainingId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location?: string;
  notes?: string;
  isCancelled: boolean;
  _count: {
    attendances: number;
  };
}

export default function AttendancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showAttendanceTracker, setShowAttendanceTracker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trainings?upcoming=true');
      if (response.ok) {
        const data = await response.json();
        const trainingsArray = data.trainings || data;
        setTrainings(Array.isArray(trainingsArray) ? trainingsArray : []);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Antrenmanlar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session: TrainingSession) => {
    const training = trainings.find(t => t.id === selectedTraining);
    if (training) {
      setSelectedSession({
        ...session,
        training: training
      } as any);
      setShowAttendanceTracker(true);
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
        const result = await response.json();
        setShowAttendanceTracker(false);
        setSelectedSession(null);
        fetchTrainings();
        toast({
          title: "Başarılı",
          description: result.message || "Yoklama kaydedildi",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Hata",
          description: error.error || "Yoklama kaydedilemedi",
          variant: "destructive",
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (start: Date, end: Date) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getAttendanceRate = (session: TrainingSession, training: Training) => {
    if (training.group._count.students === 0) return 0;
    return Math.round((session._count.attendances / training.group._count.students) * 100);
  };

  const selectedTrainingData = trainings.find(t => t.id === selectedTraining);
  const upcomingSessions = selectedTrainingData?.sessions.filter(s => {
    const sessionDate = new Date(s.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate >= today && !s.isCancelled;
  }) || [];

  // Show attendance tracker
  if (showAttendanceTracker && selectedSession) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <AttendanceTracker
            session={selectedSession as any}
            onSubmit={handleAttendanceSubmit}
            onCancel={() => {
              setShowAttendanceTracker(false);
              setSelectedSession(null);
            }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Yoklama Al</h1>
          <p className="text-muted-foreground">
            Antrenman seçip öğrenci yoklamasını kaydedin
          </p>
        </div>

        {/* Training Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Antrenman Seç
            </CardTitle>
            <CardDescription>
              Yoklama almak istediğiniz antrenmanı seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Yükleniyor...
              </div>
            ) : trainings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Gelecek antrenman bulunamadı
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                  <SelectTrigger>
                    <SelectValue placeholder="Antrenman seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trainings.map((training) => (
                      <SelectItem key={training.id} value={training.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{training.name}</span>
                          <span className="text-muted-foreground">
                            - {training.group.name}
                          </span>
                          <Badge variant="outline">
                            {training.sessions.length} seans
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions List */}
        {selectedTraining && upcomingSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Yaklaşan Seanslar
              </CardTitle>
              <CardDescription>
                {selectedTrainingData?.name} - {selectedTrainingData?.group.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.map((session) => {
                  const attendanceRate = getAttendanceRate(session, selectedTrainingData!);
                  const isCompleted = session._count.attendances > 0;
                  
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatDate(session.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            <span className="text-xs">
                              ({getDuration(session.startTime, session.endTime)})
                            </span>
                          </div>
                        </div>
                        
                        {session.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {session.location}
                          </div>
                        )}
                        
                        {session.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Not:</strong> {session.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {isCompleted && (
                          <div className="text-center">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                %{attendanceRate}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session._count.attendances}/{selectedTrainingData?.group._count.students}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => handleSessionSelect(session)}
                          variant={isCompleted ? "outline" : "default"}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          {isCompleted ? 'Düzenle' : 'Yoklama Al'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTraining && upcomingSessions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Yaklaşan seans bulunamadı</h3>
              <p className="text-muted-foreground">
                Bu antrenman için henüz planlanmış gelecek seans yok
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
