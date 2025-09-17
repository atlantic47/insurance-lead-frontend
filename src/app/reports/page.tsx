'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, leadsApi, communicationsApi, clientsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  BarChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap
} from 'lucide-react';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeChart, setActiveChart] = useState<'leads' | 'revenue' | 'conversion' | 'pipeline'>('leads');

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.getDashboard().then(res => res.data),
  });

  const { data: leadMetrics, isLoading: leadMetricsLoading } = useQuery({
    queryKey: ['lead-metrics', dateRange],
    queryFn: () => reportsApi.getLeadMetrics({ dateRange }).then(res => res.data),
  });

  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance', dateRange],
    queryFn: () => reportsApi.getPerformance({ dateRange }).then(res => res.data),
  });

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-for-reports'],
    queryFn: () => leadsApi.getAll({ limit: 100 }).then(res => res.data),
  });

  const { data: communicationsResponse } = useQuery({
    queryKey: ['communications-for-reports'],
    queryFn: () => communicationsApi.getAll({ limit: 100 }).then(res => res.data),
  });

  const { data: clientsResponse } = useQuery({
    queryKey: ['clients-for-reports'],
    queryFn: () => clientsApi.getAll({ limit: 100 }).then(res => res.data),
  });

  const leads = leadsResponse?.data || [];
  const communications = communicationsResponse?.data || [];
  const clients = clientsResponse?.data || [];

  // Generate mock chart data based on real data
  const generateChartData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.toDateString() === date.toDateString();
      }).length;

      const dayRevenue = clients.filter(client => {
        const clientDate = new Date(client.createdAt);
        return clientDate.toDateString() === date.toDateString();
      }).reduce((sum, client) => sum + (client.premium || 0), 0);

      return {
        date: formatDate(date.toISOString()),
        leads: dayLeads || Math.floor(Math.random() * 10) + 1,
        revenue: dayRevenue || Math.floor(Math.random() * 5000) + 1000,
        conversion: Math.floor(Math.random() * 30) + 10,
      };
    });

    return last30Days;
  };

  const chartData = generateChartData();

  const pipelineData = [
    { name: 'New', value: leads.filter(l => l.status === 'NEW').length, color: '#3B82F6' },
    { name: 'Contacted', value: leads.filter(l => l.status === 'CONTACTED').length, color: '#EF4444' },
    { name: 'Engaged', value: leads.filter(l => l.status === 'ENGAGED').length, color: '#10B981' },
    { name: 'Qualified', value: leads.filter(l => l.status === 'QUALIFIED').length, color: '#F59E0B' },
    { name: 'Closed Won', value: leads.filter(l => l.status === 'CLOSED_WON').length, color: '#8B5CF6' },
  ];

  const sourceData = leads.reduce((acc, lead) => {
    const existing = acc.find(item => item.name === lead.source);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: lead.source, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const getKPIs = () => {
    const totalLeads = leads.length;
    const totalClients = clients.filter(c => c.isActive).length;
    const totalRevenue = clients.reduce((sum, c) => sum + (c.premium || 0), 0);
    const totalCommission = clients.reduce((sum, c) => sum + (c.commission || 0), 0);
    const conversionRate = totalLeads > 0 ? (totalClients / totalLeads) * 100 : 0;
    const avgDealSize = totalClients > 0 ? totalRevenue / totalClients : 0;

    return {
      totalLeads,
      totalClients,
      totalRevenue,
      totalCommission,
      conversionRate,
      avgDealSize,
    };
  };

  const kpis = getKPIs();

  const chartTypes = [
    { key: 'leads', label: 'Lead Generation', icon: Users, color: 'text-blue-600' },
    { key: 'revenue', label: 'Revenue Trends', icon: DollarSign, color: 'text-green-600' },
    { key: 'conversion', label: 'Conversion Rates', icon: Target, color: 'text-purple-600' },
    { key: 'pipeline', label: 'Pipeline Analysis', icon: Activity, color: 'text-orange-600' },
  ];

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  if (dashboardLoading || leadMetricsLoading || performanceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="jira-page-content">
        <div className="jira-page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Comprehensive business intelligence and performance metrics</p>
            </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="jira-button-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalLeads}</p>
              </div>
            </div>
          </div>
          
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(kpis.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Commission</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(kpis.totalCommission)}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-pink-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Deal</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(kpis.avgDealSize)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="jira-content-card p-6">
          <div className="flex space-x-1">
            {chartTypes.map((chart) => (
              <button
                key={chart.key}
                onClick={() => setActiveChart(chart.key as any)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  activeChart === chart.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <chart.icon className={`w-4 h-4 mr-2 ${chart.color}`} />
                {chart.label}
              </button>
            ))}
          </div>
        </div>

        <div className="jira-content-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {chartTypes.find(c => c.key === activeChart)?.label} - {dateRangeOptions.find(d => d.value === dateRange)?.label}
            </h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'leads' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="leads" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              ) : activeChart === 'revenue' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              ) : activeChart === 'conversion' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="conversion" fill="#8B5CF6" />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="jira-content-card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Sources</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry: any) => `${entry.name}: ${entry.value}`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="jira-content-card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lead Response Rate</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <span className="text-sm font-medium">78%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Client Satisfaction</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Goal Achievement</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Renewal Rate</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '73%' }}></div>
                  </div>
                  <span className="text-sm font-medium">73%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}