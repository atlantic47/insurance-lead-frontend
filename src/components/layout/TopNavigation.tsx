'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Building2, Search, Bell, Settings, HelpCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

export default function TopNavigation() {
  const { user, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications/unread').then((r: any) => r.data),
    refetchInterval: 30000, // Poll every 30s
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => api.get('/notifications/count').then((r: any) => r.data.count),
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleMarkAsRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <div className="jira-topnav flex items-center justify-between px-6">
      {/* Left side - Logo and Project */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-white font-semibold text-lg">InsuranceHub</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6 ml-8">
          <a href="/dashboard" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
            Dashboard
          </a>
          <a href="/leads" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
            Projects
          </a>
          <a href="/reports" className="text-white/90 hover:text-white transition-colors text-sm font-medium">
            Reports
          </a>
        </div>
      </div>

      {/* Right side - Search, Notifications, User */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/60 text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-20">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {notifications && notifications.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No new notifications</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Help */}
        <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 hover:bg-white/90 transition-colors">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </button>
            
            {/* User Dropdown */}
            <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}