'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Users, Award, Edit, Trash2, User, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrainerForm } from '@/components/trainers/TrainerForm';
import { useToast } from '@/hooks/use-toast';

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
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await fetch('/api/trainers');
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        setTrainers(Array.isArray(data) ? data : (data.trainers || []));
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

  const filteredTrainers = trainers.filter(trainer => {
    const search = searchTerm.toLowerCase();
    return (
      trainer.name.toLowerCase().includes(search) ||
      trainer.position.toLowerCase().includes(search) ||
      trainer.license?.toLowerCase().includes(search) ||
      trainer.experience.toString().includes(search)
    );
  });

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

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ad, pozisyon veya lisans ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Trainers Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-lg text-gray-600">Yükleniyor...</div>
            </div>
          ) : trainers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg text-gray-600 mb-2">Henüz antrenör yok</div>
              <p className="text-gray-500 mb-4">
                İlk antrenörü eklemek için başlayın
              </p>
              <Button onClick={() => setShowTrainerForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Antrenör Ekle
              </Button>
            </div>
          ) : filteredTrainers.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-lg text-gray-600 mb-2">Sonuç bulunamadı</div>
              <p className="text-gray-500 mb-4">
                Arama kriterlerinize uygun antrenör bulunamadı
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Aramayı Temizle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Antrenör
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pozisyon
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deneyim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lisans
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrainers.map((trainer) => (
                    <tr key={trainer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {trainer.photo ? (
                            <img 
                              src={trainer.photo} 
                              alt={trainer.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                            {trainer.biography && (
                              <div className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                                {trainer.biography}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{trainer.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{trainer.experience} yıl</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {trainer.license || <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={trainer.isActive ? "default" : "secondary"}>
                          {trainer.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTrainer(trainer)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteTrainer(trainer.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Sil
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
