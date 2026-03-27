'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import AttendanceMarking from '@/components/trainings/AttendanceMarking';
import AttendanceMonthlyList from '@/components/trainings/AttendanceMonthlyList';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';
import { ClipboardCheck, CalendarDays } from 'lucide-react';

export default function AttendancePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'today' | 'monthly'>('today');
  const [jumpDate, setJumpDate] = useState<string | undefined>();
  const [jumpGroupId, setJumpGroupId] = useState<string | undefined>();

  const handleTakeAttendance = (date: string, groupId: string) => {
    setJumpDate(date);
    setJumpGroupId(groupId);
    setActiveTab('today');
  };

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <AppLayout>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Yoklama Al
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'monthly'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Aylık Liste
          </button>
        </div>

        {activeTab === 'today' ? (
          <AttendanceMarking key={`${jumpDate ?? ''}-${jumpGroupId ?? ''}`} initialDate={jumpDate} initialGroupId={jumpGroupId} />
        ) : (
          <AttendanceMonthlyList onTakeAttendance={handleTakeAttendance} />
        )}
      </div>
    </AppLayout>
  );
}