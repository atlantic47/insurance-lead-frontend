'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const { user, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (isHydrated && !isLoading && !hasChecked) {
      console.log('🏠 Home page routing decision:', { user: !!user, isLoading, isHydrated });
      setHasChecked(true);
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, isHydrated, router, hasChecked]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
