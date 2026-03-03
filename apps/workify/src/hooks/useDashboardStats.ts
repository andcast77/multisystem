'use client';

import { useState, useEffect } from 'react';
import { workifyApi } from '@/lib/api/client';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  suspendedEmployees: number;
  totalRoles: number;
  totalDepartments: number;
  // Estadísticas de hoy
  todayScheduled: number;
  todayActive: number;
  isWorkDay: boolean;
  workDayReason?: string;
}

interface DepartmentStat {
  name: string;
  count: number;
}

interface RecentActivity {
  id: string;
  name: string;
  position: string;
  department: string;
  dateJoined: string;
  createdAt: string;
  type: string;
  message: string;
}

interface DashboardData {
  stats: DashboardStats;
  departmentStats: DepartmentStat[];
  recentActivity: RecentActivity[];
  company: {
    name: string;
  };
}

export function useDashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await workifyApi.get<{ totalEmployees?: number }>('/dashboard/stats');
        setData({
          stats: {
            totalEmployees: result.totalEmployees ?? 0,
            activeEmployees: 0,
            inactiveEmployees: 0,
            suspendedEmployees: 0,
            totalRoles: 0,
            totalDepartments: 0,
            todayScheduled: 0,
            todayActive: 0,
            isWorkDay: true,
          },
          departmentStats: [],
          recentActivity: [],
          company: { name: '' },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await workifyApi.get<{ totalEmployees?: number }>('/dashboard/stats');
      setData({
        stats: {
          totalEmployees: result.totalEmployees ?? 0,
          activeEmployees: 0,
          inactiveEmployees: 0,
          suspendedEmployees: 0,
          totalRoles: 0,
          totalDepartments: 0,
          todayScheduled: 0,
          todayActive: 0,
          isWorkDay: true,
        },
        departmentStats: [],
        recentActivity: [],
        company: { name: '' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return {
    stats: data?.stats,
    departmentStats: data?.departmentStats || [],
    recentActivity: data?.recentActivity || [],
    company: data?.company,
    loading,
    error,
    refetch,
  };
} 