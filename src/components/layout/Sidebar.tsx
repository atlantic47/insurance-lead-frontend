'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  MessageSquare,
  CheckSquare,
  Package,
  UserCheck,
  Bot,
  Settings,
  Home,
  MessageCircle,
  Mail,
  ChevronRight,
  UsersRound,
  Megaphone,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, badge: null },
  { name: 'Leads', href: '/leads', icon: Users, badge: null },
  { name: 'WhatsApp Chat', href: '/chat', icon: MessageCircle, badge: '3' },
  { name: 'AI Conversations', href: '/ai-conversations', icon: Globe, badge: null },
  { name: 'Emails', href: '/emails', icon: Mail, badge: '12' },
  { name: 'Communications', href: '/communications', icon: MessageSquare, badge: null },
  { name: 'Contacts', href: '/contacts', icon: UsersRound, badge: null },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone, badge: null },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, badge: '5' },
  { name: 'Products', href: '/products', icon: Package, badge: null },
  { name: 'Clients', href: '/clients', icon: UserCheck, badge: null },
  { name: 'AI Assistant', href: '/ai', icon: Bot, badge: null },
  { name: 'Reports', href: '/reports', icon: BarChart3, badge: null },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="jira-sidebar">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main Navigation
          </h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className={cn(
              "w-4 h-4 text-gray-400 transition-transform duration-200",
              isCollapsed ? "rotate-0" : "rotate-90"
            )} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        <nav>
          <div>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'jira-nav-item relative',
                    isActive && 'active'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="flex-shrink-0 w-4 h-4 mr-3" />
                  
                  {!isCollapsed && (
                    <>
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="jira-badge">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin Section */}
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER) && (
            <div className="mt-6">
              {!isCollapsed && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
              )}
              
              <div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'jira-nav-item relative',
                        isActive && 'active'
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className="flex-shrink-0 w-4 h-4 mr-3" />
                      
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}