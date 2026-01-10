'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingDown, Users, CheckCircle2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Group {
  id: string;
  name: string;
}

interface StudentAnalytics {
  id: string;
  firstName: string;
  lastName: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  consecutiveAbsences: number;
  hasWarning: boolean;
}

interface GroupAnalytics {
  groupId: string;
  groupName: string;
  month: number;
  year: number;
  totalSessions: number;
  students: StudentAnalytics[];
  avgAttendance: number;
}

export default function AttendanceAnalytics() {
  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        if (!response.ok) throw new Error('Gruplar yüklenemedi');
        const data = await response.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedGroupId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch group analytics
        const response = await fetch(
          `/api/analytics/group?month=${month}&year=${year}&groupId=${selectedGroupId}`,
          {
            headers: { 'Cache-Control': 'no-cache' }
          }
        );

        if (!response.ok) throw new Error('Analizler yüklenemedi');

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [month, year, selectedGroupId]);

  const handlePrevMonth = () => {
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

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 animate-pulse">Analizler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevMonth}
              className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="px-4 flex items-center gap-2 min-w-[160px] justify-center">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-gray-900">{monthName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative min-w-[200px]">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none pr-10"
            >
              <option value="">Grup Seçiniz...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden border border-blue-700">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CheckCircle2 className="h-32 w-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3 tracking-tight">
              <CheckCircle2 className="h-10 w-10 text-blue-300" />
              Yoklama Analizi
            </h1>
            <p className="text-blue-200 text-lg font-medium">
              {analytics?.groupName || 'Yükleniyor...'} &bull; {monthName}
            </p>
          </div>
          {analytics && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Grup Ortalaması</p>
                <p className="text-3xl font-black">%{analytics.avgAttendance.toFixed(1)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-white/20">
                <TrendingDown className={`h-6 w-6 ${analytics.avgAttendance >= 80 ? 'rotate-180 text-green-400' : 'text-orange-400'}`} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-600 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {analytics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-xl border-l-4 border-l-blue-500">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Toplam Seans</p>
              <p className="text-3xl font-bold text-blue-900">
                {analytics.totalSessions}
              </p>
            </Card>

            <Card className="p-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-xl border-l-4 border-l-green-500">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Öğrenciler</p>
              <p className="text-3xl font-bold text-green-900">
                {analytics.students.length}
              </p>
            </Card>

            <Card className="p-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-xl border-l-4 border-l-purple-500">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ort. Katılım</p>
              <p className="text-3xl font-bold text-purple-900">
                %{analytics.avgAttendance.toFixed(1)}
              </p>
            </Card>

            <Card className="p-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow rounded-xl border-l-4 border-l-orange-500">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Uyarı Alanlar</p>
              <p className="text-3xl font-bold text-orange-900">
                {analytics.students.filter(s => s.hasWarning).length}
              </p>
            </Card>
          </div>

          {/* Students Attendance Table */}
          <Card className="overflow-hidden border-none shadow-sm rounded-xl bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Öğrenci
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Katıldı
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Katılmadı
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Geç
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Mazeretli
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Katılım %
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {student.firstName} {student.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
                          {student.presentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-red-50 text-red-700 rounded-lg text-sm font-bold">
                          {student.absentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-bold">
                          {student.lateCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">
                          {student.excusedCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-lg font-black ${getAttendanceColor(
                            student.attendancePercentage
                          )}`}
                        >
                          %{student.attendancePercentage.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {student.hasWarning ? (
                            <Badge className="bg-red-50 text-red-700 border-red-100 hover:bg-red-100 flex items-center gap-1 shadow-sm px-3 py-1">
                              <TrendingDown className="h-3.5 w-3.5" />
                              Uyarı
                            </Badge>
                          ) : student.attendancePercentage >= 90 ? (
                            <Badge className="bg-green-50 text-green-700 border-green-100 hover:bg-green-100 shadow-sm px-3 py-1">Mükemmel</Badge>
                          ) : (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 shadow-sm px-3 py-1">İyi</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Warning Details */}
          {analytics.students.some(s => s.hasWarning) && (
            <Card className="p-8 border-none bg-gradient-to-br from-orange-50 to-white shadow-sm rounded-xl border-l-8 border-l-orange-400">
              <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Yoklama Uyarıları
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.students
                  .filter(s => s.hasWarning)
                  .map(student => (
                    <div
                      key={student.id}
                      className="p-4 bg-white rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all group"
                    >
                      <p className="font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        {student.consecutiveAbsences} üst üste devamsızlık
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}