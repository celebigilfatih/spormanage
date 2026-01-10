'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, Trash2, Edit2, Play, Plus } from 'lucide-react';

interface Group {
  id: string;
  name: string;
}

interface TrainingSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED';
  group: {
    id: string;
    name: string;
  };
  attendanceTaken: boolean;
  field?: {
    name: string;
  };
  location?: {
    name: string;
  };
}

export default function TrainingCalendar() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    status: 'PLANNED' as 'PLANNED' | 'COMPLETED' | 'CANCELLED'
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Fetch groups on load
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        if (!response.ok) throw new Error('Gruplar yüklenemedi');
        const data = await response.json();
        setGroups(data);
        if (data.length > 0) setSelectedGroupId(data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/training-sessions', window.location.origin);
      url.searchParams.append('month', month.toString());
      url.searchParams.append('year', year.toString());
      if (selectedGroupId) url.searchParams.append('groupId', selectedGroupId);

      const response = await fetch(url.toString(), {
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) throw new Error('Antrenman oturumları yüklenemedi');

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [month, year, selectedGroupId]);

  const handleGenerate = async () => {
    if (!selectedGroupId) return;

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          groupId: selectedGroupId,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Oturumlar oluşturulamadı');
      }

      const result = await response.json();
      setSuccess(`${result.generated} oturum başarıyla oluşturuldu!`);
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oturumlar oluşturulamadı');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleViewDetails = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  const handleEdit = (session: TrainingSession) => {
    console.log('DEBUG: Full session object:', session);
    console.log('DEBUG: Original session.date string:', session.date);
    
    try {
      setSelectedSession(session);
      
      // Pre-fill the form with current session data using local date
      const dateObj = new Date(session.date);
      console.log('DEBUG: Created Date object:', dateObj.toString());
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const datePart = `${year}-${month}-${day}`;
      
      console.log('DEBUG: Formatted datePart for input:', datePart);
      
      setEditFormData({
        date: datePart,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status
      });
      setShowEditModal(true);
    } catch (err) {
      console.error('Error opening edit modal:', err);
      setError('Düzenleme formu açılamadı');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedSession) return;

    console.log('Submitting edit for session:', selectedSession.id, editFormData);

    try {
      setEditSubmitting(true);
      setError(null);

      const response = await fetch(`/api/training-sessions/${selectedSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      console.log('Edit response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Edit error response:', errorData);
        throw new Error(errorData.error || 'Oturum güncellenemedi');
      }

      setSuccess('Oturum başarıyla güncellendi!');
      setShowEditModal(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (err) {
      console.error('Edit submission failed:', err);
      setError(err instanceof Error ? err.message : 'Oturum güncellenemedi');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/training-sessions/${selectedSession.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Oturum silinemedi');
      }

      setSuccess('Oturum başarıyla silindi!');
      setShowDeleteConfirm(false);
      setSelectedSession(null);
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oturum silinemedi');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'TAMAMLANDI';
      case 'CANCELLED':
        return 'İPTAL EDİLDİ';
      default:
        return 'PLANLANDI';
    }
  };

  const getSessionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return <div className="flex justify-center p-8 text-blue-900 font-medium italic">Antrenman takvimi yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-xl shadow-lg border border-blue-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-300" />
            Antrenman Takvimi
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Group Selection */}
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-blue-800/50 text-white border border-blue-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <option value="">Tüm Gruplar</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} className="bg-blue-900">
                  {group.name}
                </option>
              ))}
            </select>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedGroupId}
              className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 px-6"
            >
              <Play className="h-4 w-4 fill-current" />
              {generating ? 'Oluşturuluyor...' : 'Oturumları Oluştur'}
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-blue-950/30 p-3 rounded-lg border border-blue-700/50">
          <Button
            variant="ghost"
            onClick={handlePreviousMonth}
            className="text-white hover:bg-blue-700/50 px-4"
          >
            ← Önceki
          </Button>
          <span className="text-lg md:text-xl font-bold tracking-tight capitalize">{monthName}</span>
          <Button
            variant="ghost"
            onClick={handleNextMonth}
            className="text-white hover:bg-blue-700/50 px-4"
          >
            Sonraki →
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 rounded-xl">
          <Plus className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Alert className="bg-gray-50 border-gray-200 rounded-xl py-12">
          <div className="flex flex-col items-center justify-center w-full text-center space-y-3">
            <Calendar className="h-12 w-12 text-gray-300" />
            <AlertDescription className="text-gray-500 text-lg">
              {monthName} ayı için planlanmış antrenman bulunamadı.
            </AlertDescription>
          </div>
        </Alert>
      ) : (
        <div className="grid gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="p-0 overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-100 group">
              <div className="flex flex-col md:flex-row">
                {/* Date Side Strip (Mobile Top, Desktop Left) */}
                <div className="bg-gray-50 md:w-32 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 group-hover:bg-blue-50 transition-colors">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {new Date(session.date).toLocaleDateString('tr-TR', { month: 'short' })}
                  </span>
                  <span className="text-3xl font-black text-blue-900 leading-none my-1">
                    {new Date(session.date).getDate()}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 uppercase italic">
                    {new Date(session.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
                  </span>
                </div>

                <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Info Column */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-extrabold text-blue-900 group-hover:text-blue-700 transition-colors">
                          {session.group.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`${getStatusBadgeColor(session.status)} border px-2 py-0.5 text-[10px] font-black`}>
                            {getStatusText(session.status)}
                          </Badge>
                          {session.attendanceTaken ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">
                              ✓ YOKLAMA ALINDI
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold">
                              ⚠ YOKLAMA BEKLİYOR
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">SAAT</p>
                          <p className="font-semibold">{session.startTime} - {session.endTime}</p>
                        </div>
                      </div>
                      
                      {session.field && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Plus className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">SAHA</p>
                            <p className="font-semibold">{session.field.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col justify-center items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(session)}
                        className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 hover:text-blue-600 transition-all font-semibold rounded-lg"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(session)}
                        className="flex-1 sm:flex-none border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all font-semibold rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </Button>
                    </div>
                    <Button 
                      onClick={() => handleViewDetails(session)}
                      className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg shadow-sm"
                    >
                      Detayları Görüntüle
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Oturum</p>
          <p className="text-3xl font-black text-blue-900">{sessions.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tamamlanan</p>
          <p className="text-3xl font-black text-green-600">
            {sessions.filter(s => s.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Planlanan</p>
          <p className="text-3xl font-black text-blue-600">
            {sessions.filter(s => s.status === 'PLANNED').length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">İptal Edilen</p>
          <p className="text-3xl font-black text-red-600">
            {sessions.filter(s => s.status === 'CANCELLED').length}
          </p>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Antrenman Detayları</h2>
            <div className="space-y-3">
              <div><span className="font-semibold">Grup:</span> {selectedSession.group.name}</div>
              <div><span className="font-semibold">Tarih:</span> {getSessionDate(selectedSession.date)}</div>
              <div><span className="font-semibold">Saat:</span> {selectedSession.startTime} - {selectedSession.endTime}</div>
              <div><span className="font-semibold">Durum:</span> {getStatusText(selectedSession.status)}</div>
              {selectedSession.field && <div><span className="font-semibold">Saha:</span> {selectedSession.field.name}</div>}
              <div><span className="font-semibold">Yoklama:</span> {selectedSession.attendanceTaken ? 'Alındı' : 'Alınmadı'}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowDetailsModal(false)} className="bg-blue-900 hover:bg-blue-800">Kapat</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Antrenmanı Düzenle</h2>
            
            <div className="space-y-4">
              {/* Group (read-only) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Grup</label>
                <input
                  type="text"
                  value={selectedSession.group.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tarih</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Başlangıç Saati</label>
                <input
                  type="time"
                  value={editFormData.startTime}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bitiş Saati</label>
                <input
                  type="time"
                  value={editFormData.endTime}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Durum</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'PLANNED' | 'COMPLETED' | 'CANCELLED' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PLANNED">Planlandı</option>
                  <option value="COMPLETED">Tamamlandı</option>
                  <option value="CANCELLED">İptal Edildi</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                disabled={editSubmitting}
              >
                İptal
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={editSubmitting}
                className="bg-blue-900 hover:bg-blue-800"
              >
                {editSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oturumu Sil</h2>
            <p className="text-gray-700 mb-6">
              <span className="font-semibold">{selectedSession.group.name}</span> grubunun{' '}
              <span className="font-semibold">{getSessionDate(selectedSession.date)}</span> tarihli antrenmanını silmek istediğinizden emin misiniz?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>İptal</Button>
              <Button onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">Sil</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}