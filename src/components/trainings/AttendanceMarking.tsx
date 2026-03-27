'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

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
  attendances: { studentId: string; status: string; notes?: string }[];
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
}

// Local date string YYYY-MM-DD (device timezone)
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface AttendanceMarkingProps {
  initialDate?: string;
  initialGroupId?: string;
}

export default function AttendanceMarking({ initialDate, initialGroupId }: AttendanceMarkingProps = {}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId ?? '');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate ?? localDateStr());
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        if (!response.ok) throw new Error('Gruplar yüklenemedi');
        const data = await response.json();
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Gruplar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // Fetch sessions when group or date changes
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchSessions = async () => {
      try {
        setError(null);
        setSessionsLoading(true);
        setSessions([]);
        setSession(null);
        setSelectedSessionId('');
        setStudents([]);

        const response = await fetch(
          `/api/training-sessions?groupId=${selectedGroupId}&date=${selectedDate}`,
          { headers: { 'Cache-Control': 'no-cache' } }
        );

        if (!response.ok) throw new Error('Oturumlar yüklenemedi');

        const data: TrainingSession[] = await response.json();
        setSessions(data);

        if (data.length > 0) {
          setSelectedSessionId(data[0].id);
          setSession(data[0]);
        } else {
          const [y, m, d] = selectedDate.split('-');
          setError(`Bu grup için ${d}.${m}.${y} tarihinde planlanmış antrenman bulunamadı`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [selectedGroupId, selectedDate]);

  // Fetch students when session changes
  useEffect(() => {
    if (!selectedSessionId || !session) return;

    const fetchStudents = async () => {
      try {
        const studentsResponse = await fetch(
          `/api/students?groupId=${session.group.id}&status=active&limit=1000`
        );

        if (!studentsResponse.ok) throw new Error('Öğrenciler yüklenemedi');

        const studentsData = await studentsResponse.json();
        const studentList: Student[] = studentsData.students || [];
        setStudents(studentList);

        // Pre-populate from existing attendance records if already taken
        const existingMap = new Map<string, string>(
          (session.attendances || []).map(a => [a.studentId, a.status])
        );

        const initialAttendance = new Map<string, AttendanceRecord>();
        studentList.forEach((student) => {
          const existingStatus = existingMap.get(student.id);
          initialAttendance.set(student.id, {
            studentId: student.id,
            status: (existingStatus as AttendanceRecord['status']) || 'PRESENT'
          });
        });
        setAttendance(initialAttendance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Öğrenciler yüklenemedi');
      }
    };

    fetchStudents();
  }, [selectedSessionId, session]);

  // Update attendance for a student
  const updateAttendance = (studentId: string, status: AttendanceRecord['status']) => {
    const newAttendance = new Map(attendance);
    const current = newAttendance.get(studentId) || { studentId, status: 'PRESENT' };
    newAttendance.set(studentId, {
      ...current,
      status
    });
    setAttendance(newAttendance);
  };

  // Bulk mark all as present
  const markAllPresent = () => {
    const newAttendance = new Map(attendance);
    students.forEach(student => {
      const current = newAttendance.get(student.id) || { studentId: student.id, status: 'PRESENT' };
      newAttendance.set(student.id, { ...current, status: 'PRESENT' });
    });
    setAttendance(newAttendance);
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (!session) return;

    try {
      setSubmitting(true);
      setError(null);

      const attendanceArray = Array.from(attendance.values());

      const response = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_attendance',
          sessionId: session.id,
          attendance: attendanceArray
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Yoklama kaydedilemedi');
      }

      // Update session state to reflect attendance taken
      setSession(prev => prev ? { ...prev, attendanceTaken: true } : null);
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, attendanceTaken: true } : s));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yoklama kaydedilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'LATE':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'EXCUSED':
        return <Zap className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Katıldı';
      case 'ABSENT': return 'Katılmadı';
      case 'LATE': return 'Geç Kaldı';
      case 'EXCUSED': return 'Mazeretli';
      default: return status;
    }
  };

  const statusCounts = {
    PRESENT: Array.from(attendance.values()).filter(a => a.status === 'PRESENT').length,
    ABSENT: Array.from(attendance.values()).filter(a => a.status === 'ABSENT').length,
    LATE: Array.from(attendance.values()).filter(a => a.status === 'LATE').length,
    EXCUSED: Array.from(attendance.values()).filter(a => a.status === 'EXCUSED').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-blue-900 font-medium">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  const isToday = selectedDate === localDateStr();

  return (
    <div className="space-y-6">
      {/* Header with Group, Date & Session Selection */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-8 rounded-2xl shadow-xl border border-blue-800">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-3xl font-black tracking-tight">
            Antrenman Yoklaması
            {isToday && (
              <span className="ml-3 text-sm font-bold bg-amber-500 text-white px-3 py-1 rounded-full align-middle">
                BUGÜN
              </span>
            )}
          </h1>
          {!isToday && (
            <button
              onClick={() => setSelectedDate(localDateStr())}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-400 transition-all"
            >
              Bugüne Dön
            </button>
          )}
        </div>

        {/* Group, Date and Session Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">
              Grup Seçin
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-blue-800/50 text-white border border-blue-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            >
              <option value="">Seçiniz...</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} className="bg-blue-900">
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">
              Tarih Seçin
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-blue-800/50 text-white border border-blue-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-2">
              Oturum Seçin
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => {
                const sessionId = e.target.value;
                setSelectedSessionId(sessionId);
                const foundSession = sessions.find(s => s.id === sessionId);
                if (foundSession) {
                  setSession(foundSession);
                }
              }}
              disabled={sessions.length === 0 || sessionsLoading}
              className="w-full bg-blue-800/50 text-white border border-blue-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{sessionsLoading ? 'Yükleniyor...' : 'Seçiniz...'}</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-blue-900">
                  {s.startTime} - {s.endTime} ({s.attendanceTaken ? '✓ Alındı' : 'Bekliyor'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {session && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Grup</p>
              <p className="text-xl font-black">{session.group.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Saat</p>
              <p className="text-xl font-black">
                {session.startTime} - {session.endTime}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Toplam Öğrenci</p>
              <p className="text-xl font-black">{students.length}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Durum</p>
              <Badge className={`mt-1 text-xs font-black px-3 py-1 ${session.attendanceTaken ? 'bg-green-500 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                {session.attendanceTaken ? 'TAMAMLANDI' : 'BEKLİYOR'}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-900 rounded-xl">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="font-bold">
            Yoklama başarıyla kaydedildi!
          </AlertDescription>
        </Alert>
      )}

      {!session && !error && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-900 rounded-xl">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="font-bold">
            Lütfen yukarıdan grup ve oturum seçiniz.
          </AlertDescription>
        </Alert>
      )}

      {session && (
        <>
          {/* Attendance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-green-100 border-b-4 border-b-green-500 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Katıldı</p>
              <p className="text-3xl font-black text-green-600">{statusCounts.PRESENT}</p>
            </Card>
            <Card className="p-5 bg-white border-red-100 border-b-4 border-b-red-500 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Katılmadı</p>
              <p className="text-3xl font-black text-red-600">{statusCounts.ABSENT}</p>
            </Card>
            <Card className="p-5 bg-white border-amber-100 border-b-4 border-b-amber-500 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Geç Kaldı</p>
              <p className="text-3xl font-black text-amber-600">{statusCounts.LATE}</p>
            </Card>
            <Card className="p-5 bg-white border-blue-100 border-b-4 border-b-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Mazeretli</p>
              <p className="text-3xl font-black text-blue-600">{statusCounts.EXCUSED}</p>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={markAllPresent} variant="outline" className="flex-1 h-12 text-lg font-bold border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 rounded-xl transition-all">
              Hepsini Katıldı İşaretle
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-12 text-lg font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : session.attendanceTaken ? 'Yoklamayı Güncelle' : 'Yoklamayı Kaydet'}
            </Button>
          </div>

          {/* Student List */}
          <Card className="overflow-hidden rounded-2xl border-gray-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                      Öğrenci
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                      Yoklama Durumu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student, idx) => {
                    const record = attendance.get(student.id);
                    const status = record?.status || 'PRESENT';

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-blue-50/30 transition-colors"
                      >
                        <td className="px-8 py-5">
                          <div className="font-bold text-gray-900 text-lg">
                            {student.firstName} {student.lastName}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-wrap gap-2">
                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((s) => (
                              <Button
                                key={s}
                                size="sm"
                                variant={status === s ? 'default' : 'outline'}
                                onClick={() => updateAttendance(student.id, s)}
                                className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-full transition-all ${
                                  status === s
                                    ? 'bg-blue-900 text-white shadow-md scale-105'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200 hover:text-blue-600'
                                }`}
                              >
                                {getStatusIcon(s)}
                                <span>{getStatusLabel(s)}</span>
                              </Button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}