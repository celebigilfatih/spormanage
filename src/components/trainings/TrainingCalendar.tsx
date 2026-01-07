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
  // ... existing fields ...
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

  // Fetch groups on load
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        if (!response.ok) throw new Error('Failed to fetch groups');
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

      if (!response.ok) throw new Error('Failed to fetch training sessions');

      const data = await response.json();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        throw new Error(data.error || 'Failed to generate sessions');
      }

      const result = await response.json();
      setSuccess(`Successfully generated ${result.generated} sessions!`);
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sessions');
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSessionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading training calendar...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Training Calendar
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            {/* Group Selection */}
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-blue-800 text-white border border-blue-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Groups</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedGroupId}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {generating ? 'Generating...' : 'Generate Sessions'}
            </Button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousMonth}
            className="text-white border-white hover:bg-white hover:text-blue-900"
          >
            ← Previous
          </Button>
          <span className="text-xl font-semibold">{monthName}</span>
          <Button
            variant="outline"
            onClick={handleNextMonth}
            className="text-white border-white hover:bg-white hover:text-blue-900"
          >
            Next →
          </Button>
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
          <Plus className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No training sessions for {monthName}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="p-6 hover:shadow-lg transition">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900">
                        {session.group.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {getSessionDate(session.date)}
                      </p>
                    </div>
                    <Badge className={`${getStatusBadgeColor(session.status)}`}>
                      {session.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <span className="ml-2 font-medium">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                    {session.field && (
                      <div>
                        <span className="text-gray-600">Field:</span>
                        <span className="ml-2 font-medium">{session.field.name}</span>
                      </div>
                    )}
                    {session.location && (
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-medium">{session.location.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Actions */}
                <div className="flex flex-col justify-between">
                  <div>
                    {session.attendanceTaken ? (
                      <Badge className="bg-green-100 text-green-800 mb-2">
                        ✓ Attendance Taken
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 mb-2">
                        ⚠ Attendance Pending
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center gap-1"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600">Total Sessions</p>
          <p className="text-2xl font-bold text-blue-900">{sessions.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {sessions.filter(s => s.status === 'COMPLETED').length}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-blue-600">
            {sessions.filter(s => s.status === 'PLANNED').length}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">
            {sessions.filter(s => s.status === 'CANCELLED').length}
          </p>
        </Card>
      </div>
    </div>
  );
}