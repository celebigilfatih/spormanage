'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, AlertCircle, XCircle, ClipboardList } from 'lucide-react';

interface TrainingSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED';
  attendanceTaken: boolean;
  group: {
    id: string;
    name: string;
  };
  attendances: { id: string; status: string }[];
}

interface Group {
  id: string;
  name: string;
}

const TR_DAYS: Record<string, string> = {
  Monday: 'Pazartesi',
  Tuesday: 'Salı',
  Wednesday: 'Çarşamba',
  Thursday: 'Perşembe',
  Friday: 'Cuma',
  Saturday: 'Cumartesi',
  Sunday: 'Pazar',
};

const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

interface AttendanceMonthlyListProps {
  onTakeAttendance?: (date: string, groupId: string) => void;
}

export default function AttendanceMonthlyList({ onTakeAttendance }: AttendanceMonthlyListProps = {}) {
  const now = new Date();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Fetch groups on mount
  useEffect(() => {
    fetch('/api/groups')
      .then((r) => r.json())
      .then((data) => {
        setGroups(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch sessions when filters change
  useEffect(() => {
    if (!selectedGroupId) return;
    setLoading(true);
    fetch(
      `/api/training-sessions?groupId=${selectedGroupId}&month=${selectedMonth}&year=${selectedYear}`
    )
      .then((r) => r.json())
      .then((data) => {
        const sorted = (Array.isArray(data) ? data : []).sort(
          (a: TrainingSession, b: TrainingSession) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setSessions(sorted);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [selectedGroupId, selectedMonth, selectedYear]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}.${month}.${year}`;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const en = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    return TR_DAYS[en] ?? en;
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const totalSessions = sessions.length;
  const takenCount = sessions.filter((s) => s.attendanceTaken).length;
  const pendingCount = sessions.filter(
    (s) => !s.attendanceTaken && s.status !== 'CANCELLED'
  ).length;
  const cancelledCount = sessions.filter((s) => s.status === 'CANCELLED').length;

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-8 rounded-2xl shadow-xl border border-blue-800">
        <h2 className="text-3xl font-black mb-6 tracking-tight">Aylık Antrenman Takvimi</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Group */}
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">
              Grup
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-blue-800/50 text-white border border-blue-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <option value="">Seçiniz...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} className="bg-blue-900">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">
              Ay
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-blue-800/50 text-white border border-blue-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              {TR_MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1} className="bg-blue-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">
              Yıl
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-blue-800/50 text-white border border-blue-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-blue-900">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        {totalSessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Toplam</p>
              <p className="text-2xl font-black">{totalSessions}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Yoklama Alındı</p>
              <p className="text-2xl font-black text-green-300">{takenCount}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Bekliyor</p>
              <p className="text-2xl font-black text-amber-300">{pendingCount}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">İptal</p>
              <p className="text-2xl font-black text-red-300">{cancelledCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden rounded-2xl border-gray-100 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-blue-900 font-medium">Yükleniyor...</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center p-12 text-gray-400">
            <Calendar className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold">Bu ay için antrenman bulunamadı</p>
            <p className="text-sm mt-1 opacity-70">
              Farklı bir ay veya grup seçin ya da önce antrenman oluşturun.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest w-10">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Tarih
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Gün
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Saat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                    Yoklama
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">
                    Katılım
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map((session, idx) => {
                  const isToday =
                    formatDate(session.date) === formatDate(new Date().toISOString());
                  const presentCount = session.attendances?.filter(
                    (a) => a.status === 'PRESENT'
                  ).length ?? 0;
                  const totalAttendance = session.attendances?.length ?? 0;

                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isToday ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-bold text-gray-300">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                          {formatDate(session.date)}
                          {isToday && (
                            <span className="ml-2 text-xs font-black text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
                              BUGÜN
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {getDayName(session.date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {session.startTime} – {session.endTime}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            session.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700 border-0'
                              : session.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700 border-0'
                              : 'bg-amber-100 text-amber-700 border-0'
                          }
                        >
                          {session.status === 'COMPLETED'
                            ? 'Tamamlandı'
                            : session.status === 'CANCELLED'
                            ? 'İptal'
                            : 'Planlandı'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {session.attendanceTaken ? (
                          <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Alındı
                          </span>
                        ) : session.status === 'CANCELLED' ? (
                          <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <XCircle className="w-4 h-4" />
                            —
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-600 font-bold text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Bekleniyor
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {session.attendanceTaken && totalAttendance > 0 ? (
                          <span className="text-sm font-bold text-gray-700">
                            {presentCount}
                            <span className="text-gray-400 font-normal"> / {totalAttendance}</span>
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {session.status !== 'CANCELLED' ? (
                          <button
                            onClick={() => onTakeAttendance?.(session.date.split('T')[0], selectedGroupId)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              session.attendanceTaken
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            {session.attendanceTaken ? 'Güncelle' : 'Yoklama Al'}
                          </button>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
