import { headers } from 'next/headers';
import { useEffect, useState } from 'react';
import { UserWithRelations } from '@/types';
import { authApi, workifyApi } from '@/lib/api/client';

// Definir el tipo AuthContextType localmente
interface AuthContextType {
  user: UserWithRelations | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    companyName: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
}

// ========================================
// TIPOS DE AUTENTICACIÓN
// ========================================

export interface UserInfo {
  userId: string;
  email: string;
  companyId: string;
}

// ========================================
// FUNCIONES DE AUTENTICACIÓN DEL SERVIDOR
// ========================================

export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const email = headersList.get('x-user-email');
    const companyId = headersList.get('x-company-id');

    if (!userId || !email || !companyId) {
      return null;
    }

    return {
      userId,
      email,
      companyId,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<UserInfo> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// ========================================
// FUNCIONES DE AUTENTICACIÓN DEL CLIENTE
// ========================================
// Uses unified API client (authApi) so base URL and auth headers are consistent.

export async function checkAuthStatus(): Promise<UserWithRelations | null> {
  try {
    const data = await workifyApi.get<{ user?: UserWithRelations }>('/me');
    return data?.user ?? null;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return null;
  }
}

export async function loginUser(credentials: { email: string; password: string }): Promise<UserWithRelations> {
  const data = await authApi.post<{ user: UserWithRelations; token?: string }>('/login', credentials);
  const user = data?.user;
  if (!user) throw new Error('Login failed');
  // If API returns token and we're on client, set cookie for same-origin or cross-origin
  if (typeof document !== 'undefined' && data?.token) {
    document.cookie = `token=${encodeURIComponent(data.token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  }
  return user;
}

export async function logoutUser(): Promise<void> {
  try {
    await authApi.post('/logout');
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; max-age=0';
  }
  window.location.href = '/login';
}

export async function registerUser(data: {
  email: string;
  password: string;
  companyName: string;
  firstName: string;
  lastName: string;
}): Promise<UserWithRelations> {
  const responseData = await authApi.post<{ user: UserWithRelations; token?: string }>('/register', data);
  const user = responseData?.user;
  if (!user) throw new Error('Registration failed');
  if (typeof document !== 'undefined' && responseData?.token) {
    document.cookie = `token=${encodeURIComponent(responseData.token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  }
  return user;
}

// ========================================
// HOOK DE AUTENTICACIÓN PARA REACT
// ========================================

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<UserWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await checkAuthStatus();
      setUser(userData);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const userData = await loginUser(credentials);
    setUser(userData);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const register = async (data: {
    email: string;
    password: string;
    companyName: string;
    firstName: string;
    lastName: string;
  }) => {
    const userData = await registerUser(data);
    setUser(userData);
  };

  return {
    user,
    loading,
    login,
    logout,
    register,
  };
} 