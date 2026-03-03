'use client';

import { useState, useEffect, useCallback } from 'react';
import { workifyApi } from '@/lib/api/client';

interface DailyAttendanceStats {
  present: number;
  isWorkDay?: boolean;
  workDayReason?: string;
  late?: number;
  absent?: number;
  onBreak?: number;
  expected?: number;
  employeesLate?: number;
  employeesAbsent?: number;
  employeesScheduled?: number;
  employeesOnBreak?: number;
  employeesWorking?: number;
}

interface UseAttendanceStatsReturn {
  stats: DailyAttendanceStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAttendanceStats(date?: Date): UseAttendanceStatsReturn {
  const [stats, setStats] = useState<DailyAttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dateParam = date ? date.toISOString().split('T')[0] : '';
      const data = await workifyApi.get<{ present?: number }>(`/attendance/stats${dateParam ? `?date=${dateParam}` : ''}`);
      setStats({ present: data.present ?? 0 } as DailyAttendanceStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
} 