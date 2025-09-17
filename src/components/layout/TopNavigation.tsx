'use client';

import { useAuthStore } from '@/store/auth';
import { Building2, Search, Bell, Settings, HelpCircle } from 'lucide-react';

export default function TopNavigation() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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
        <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
          <Bell className="w-5 h-5" />
        </button>

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