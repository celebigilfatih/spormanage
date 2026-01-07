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
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
}

export default function AttendanceMarking() {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch today's training session
  useEffect(() => {
    const fetchTodaySession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get today's session
        const response = await fetch(
          `/api/training-sessions?date=${new Date().toISOString().split('T')[0]}`,
          {
            headers: {
              'Cache-Control': 'no-cache'
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch session');

        const sessions = await response.json();
        
        if (sessions.length === 0) {
          setError('No training session scheduled for today');
          setSession(null);
          setStudents([]);
          return;
        }

        const todaySession = sessions[0];
        setSession(todaySession);

        // Fetch students for the group
        const studentsResponse = await fetch(
          `/api/students?groupId=${todaySession.group.id}&status=active&limit=1000`
        );

        if (!studentsResponse.ok) throw new Error('Failed to fetch students');

        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students || []);

        // Initialize attendance map
        const initialAttendance = new Map<string, AttendanceRecord>();
        studentsData.students?.forEach((student: Student) => {
          initialAttendance.set(student.id, {
            studentId: student.id,
            status: 'PRESENT'
          });
        });
        setAttendance(initialAttendance);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySession();
  }, []);

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
        throw new Error(errorData.error || 'Failed to mark attendance');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance');
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

  const statusCounts = {
    PRESENT: Array.from(attendance.values()).filter(a => a.status === 'PRESENT').length,
    ABSENT: Array.from(attendance.values()).filter(a => a.status === 'ABSENT').length,
    LATE: Array.from(attendance.values()).filter(a => a.status === 'LATE').length,
    EXCUSED: Array.from(attendance.values()).filter(a => a.status === 'EXCUSED').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading today's training...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'No training session for today'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Today's Training Attendance</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-sm opacity-75">Group</p>
            <p className="text-lg font-semibold">{session.group.name}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Time</p>
            <p className="text-lg font-semibold">
              {session.startTime} - {session.endTime}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-75">Total Students</p>
            <p className="text-lg font-semibold">{students.length}</p>
          </div>
          <div>
            <p className="text-sm opacity-75">Status</p>
            <Badge variant={session.attendanceTaken ? 'secondary' : 'default'}>
              {session.attendanceTaken ? 'Completed' : 'Pending'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-600 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Attendance marked successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-gray-600">Present</p>
          <p className="text-2xl font-bold text-green-600">{statusCounts.PRESENT}</p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-2xl font-bold text-red-600">{statusCounts.ABSENT}</p>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-gray-600">Late</p>
          <p className="text-2xl font-bold text-yellow-600">{statusCounts.LATE}</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600">Excused</p>
          <p className="text-2xl font-bold text-blue-600">{statusCounts.EXCUSED}</p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={markAllPresent} variant="outline" className="flex-1">
          Mark All Present
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || session.attendanceTaken}
          className="flex-1 bg-blue-900 hover:bg-blue-800"
        >
          {submitting ? 'Saving...' : 'Save Attendance'}
        </Button>
      </div>

      {/* Student List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const record = attendance.get(student.id);
                const status = record?.status || 'PRESENT';

                return (
                  <tr
                    key={student.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={status === s ? 'default' : 'outline'}
                            onClick={() => updateAttendance(student.id, s)}
                            className={`flex items-center gap-1 ${
                              status === s
                                ? 'bg-blue-900 text-white'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            {getStatusIcon(s)}
                            <span className="hidden sm:inline">{s}</span>
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
    </div>
  );
}