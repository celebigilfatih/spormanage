'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Award, Edit, Trash2, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrainerForm } from '@/components/trainers/TrainerForm';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal } from 'lucide-react';

interface Trainer {
  id: string;
  name: string;
  position: string;
  experience: number;
  license?: string;
  photo?: string;
  biography?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/trainers');
      if (response.ok) {
        const data = await response.json();
        setTrainers(Array.isArray(data.trainers) ? data.trainers : []);
      } else {
        setTrainers([]);
      }
    } catch (error) {
      setTrainers([]);
      toast({
        title: "Hata",
        description: "Antrenörler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrainerSubmit = async (data: any) => {
    try {
      const isEditing = !!editingTrainer;
      const url = isEditing ? `/api/trainers/${editingTrainer.id}` : '/api/trainers';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setShowTrainerForm(false);
        setEditingTrainer(null);
        fetchTrainers();
        toast({
          title: "Başarılı",
          description: isEditing ? "Antrenör güncellendi" : "Antrenör eklendi",
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

  const handleEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setShowTrainerForm(true);
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm('Bu antrenörü silmek istediğinizden emin misiniz?')) return;

    try {
      const response = await fetch(`/api/trainers/${trainerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTrainers();
        toast({
          title: "Başarılı",
          description: "Antrenör silindi",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Antrenör silinemedi",
        variant: "destructive",
      });
    }
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

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Teknik Kadro</h1>
            <p className="text-muted-foreground">
              Antrenörler ve teknik kadro yönetimi
            </p>
          </div>
          <Button onClick={() => {
            setEditingTrainer(null);
            setShowTrainerForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Antrenör
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Antrenör</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainers.filter(t => t.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lisanslı</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {trainers.filter(t => t.license).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trainers List */}
        <Card>
          <CardHeader>
            <CardTitle>Antrenörler</CardTitle>
            <CardDescription>
              Tüm teknik kadro üyeleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trainers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Henüz antrenör yok</h3>
                <p className="text-muted-foreground mb-4">
                  İlk antrenörü eklemek için başlayın
                </p>
                <Button onClick={() => setShowTrainerForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Antrenör Ekle
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainers.map((trainer) => (
                  <Card key={trainer.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {trainer.photo ? (
                            <img 
                              src={trainer.photo} 
                              alt={trainer.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-8 w-8 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{trainer.name}</h3>
                            <p className="text-sm text-muted-foreground">{trainer.position}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTrainer(trainer)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteTrainer(trainer.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>{trainer.experience} yıl deneyim</span>
                        </div>
                        {trainer.license && (
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span>{trainer.license}</span>
                          </div>
                        )}
                        {trainer.biography && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                            {trainer.biography}
                          </p>
                        )}
                      </div>

                      <div className="mt-4">
                        <Badge variant={trainer.isActive ? "default" : "secondary"}>
                          {trainer.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trainer Form Dialog */}
      <Dialog open={showTrainerForm} onOpenChange={setShowTrainerForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTrainer ? 'Antrenör Düzenle' : 'Yeni Antrenör Ekle'}
            </DialogTitle>
          </DialogHeader>
          <TrainerForm
            trainer={editingTrainer}
            onSubmit={handleTrainerSubmit}
            onCancel={() => {
              setShowTrainerForm(false);
              setEditingTrainer(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
