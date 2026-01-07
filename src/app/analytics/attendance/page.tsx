'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import AttendanceAnalytics from '@/components/trainings/AttendanceAnalytics';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
        <AttendanceAnalytics />
      </div>
    </AppLayout>
  );
}