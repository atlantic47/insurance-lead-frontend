'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { Users, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.getDashboard().then(res => res.data),
  });

  const stats = [
    {
      name: 'Total Leads',
      value: dashboardData?.totalLeads || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      name: 'Conversion Rate',
      value: `${dashboardData?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+5.2%',
    },
    {
      name: 'Active Tasks',
      value: dashboardData?.activeTasks || 0,
      icon: CheckCircle,
      color: 'bg-yellow-500',
      change: '-3',
    },
    {
      name: 'Revenue',
      value: `$${dashboardData?.revenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+8.1%',
    },
  ];

  return (
    <DashboardLayout>
      <div className="jira-page-header">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening with your leads.</p>
      </div>
      
      <div className="jira-page-content">

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="jira-stat-card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div key={stat.name} className="jira-stat-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.change} from last month</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="jira-content-card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.recentActivity?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8 text-sm">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          <div className="jira-content-card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Lead Pipeline</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.pipelineData?.map((stage: any) => (
                  <div key={stage.status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{stage.status}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${(stage.count / (dashboardData?.totalLeads || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-6 text-right">{stage.count}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8 text-sm">No pipeline data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}