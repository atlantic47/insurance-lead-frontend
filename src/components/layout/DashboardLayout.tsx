'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import TopNavigation from './TopNavigation';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();

  console.log('🏢 DashboardLayout render:', { 
    user: !!user, 
    isLoading, 
    isHydrated, 
    userEmail: user?.email 
  });

  useEffect(() => {
    console.log('🏢 DashboardLayout useEffect:', { user: !!user, isLoading, isHydrated });
    // Only redirect if hydration is complete and there's no user
    if (isHydrated && !isLoading && !user) {
      console.log('🏢 Redirecting to login from DashboardLayout');
      router.push('/login');
    }
  }, [user, isLoading, isHydrated, router]);

  // Show loading if not hydrated or still loading
  if (!isHydrated || isLoading) {
    console.log('🏢 DashboardLayout showing loading...', { isHydrated, isLoading });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log('🏢 DashboardLayout: No user, returning null');
    return null;
  }

  console.log('🏢 DashboardLayout: Rendering dashboard for user:', user.email);

  return (
    <div className="min-h-screen">
      <TopNavigation />
      <div className="flex">
        <Sidebar />
        <main className="jira-main-content overflow-y-auto custom-scrollbar flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}