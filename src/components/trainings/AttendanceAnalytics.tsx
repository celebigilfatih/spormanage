'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingDown, Users, CheckCircle2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch group analytics
        const response = await fetch(
          `/api/analytics/group?month=${month}&year=${year}`,
          {
            headers: { 'Cache-Control': 'no-cache' }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch analytics');

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [month, year]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-8 w-8" />
          Attendance Analytics
        </h1>
        <p className="text-blue-100">{monthName}</p>
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
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-600">
                {analytics.totalSessions}
              </p>
            </Card>

            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics.students.length}
              </p>
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics.avgAttendance.toFixed(1)}%
              </p>
            </Card>

            <Card className="p-4 bg-orange-50 border-orange-200">
              <p className="text-sm text-gray-600">With Warnings</p>
              <p className="text-2xl font-bold text-orange-600">
                {analytics.students.filter(s => s.hasWarning).length}
              </p>
            </Card>
          </div>

          {/* Students Attendance Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Student
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Present
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Late
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Excused
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Attendance %
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.students.map((student, idx) => (
                    <tr
                      key={student.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {student.presentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          {student.absentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          {student.lateCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {student.excusedCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-lg font-bold ${getAttendanceColor(
                            student.attendancePercentage
                          )}`}
                        >
                          {student.attendancePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.hasWarning ? (
                          <Badge className="bg-red-100 text-red-800 flex items-center gap-1 justify-center">
                            <TrendingDown className="h-3 w-3" />
                            Warning
                          </Badge>
                        ) : student.attendancePercentage >= 90 ? (
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Warning Details */}
          {analytics.students.some(s => s.hasWarning) && (
            <Card className="p-6 border-orange-200 bg-orange-50">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Attendance Warnings
              </h3>
              <div className="space-y-2">
                {analytics.students
                  .filter(s => s.hasWarning)
                  .map(student => (
                    <div
                      key={student.id}
                      className="p-3 bg-white rounded border-l-4 border-orange-400"
                    >
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {student.consecutiveAbsences} consecutive absence
                        {student.consecutiveAbsences > 1 ? 's' : ''}
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