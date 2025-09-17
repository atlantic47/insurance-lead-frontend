'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Initialize auth state on app load
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}