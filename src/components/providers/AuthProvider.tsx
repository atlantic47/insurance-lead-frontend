'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      console.log('🔧 AuthProvider: Starting auth check...');
      console.log('📦 Current localStorage auth-storage:', localStorage.getItem('auth-storage'));
      checkAuth();
    }
  }, [checkAuth, isHydrated]);

  if (!isHydrated) {
    return <>{children}</>;
  }

  return <>{children}</>;
}