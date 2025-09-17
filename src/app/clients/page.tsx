'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ClientCard from '@/components/clients/ClientCard';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { Client } from '@/types';
import { 
  Search, 
  Plus, 
  Users, 
  UserCheck,
  UserX,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [renewalFilter, setRenewalFilter] = useState<'ALL' | 'upcoming' | 'overdue'>('ALL');

  const { data: clientsResponse, isLoading } = useQuery({
    queryKey: ['clients', { search: searchTerm, status: statusFilter, renewal: renewalFilter }],
    queryFn: () => clientsApi.getAll({
      search: searchTerm,
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'active',
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }).then(res => res.data),
  });

  const clients = clientsResponse?.data || [];

  const getClientStats = () => {
    const total = clients.length;
    const active = clients.filter(c => c.isActive).length;
    const inactive = clients.filter(c => !c.isActive).length;
    
    const upcomingRenewals = clients.filter(c => 
      c.renewalDate && 
      new Date(c.renewalDate) > new Date() && 
      new Date(c.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    const totalPremiums = clients
      .filter(c => c.premium && c.isActive)
      .reduce((sum, c) => sum + (c.premium || 0), 0);
    
    const totalCommissions = clients
      .filter(c => c.commission && c.isActive)
      .reduce((sum, c) => sum + (c.commission || 0), 0);

    return { 
      total, 
      active, 
      inactive, 
      upcomingRenewals, 
      totalPremiums, 
      totalCommissions 
    };
  };

  const clientStats = getClientStats();

  const filteredClients = clients.filter(client => {
    if (renewalFilter === 'upcoming') {
      return client.renewalDate && 
        new Date(client.renewalDate) > new Date() && 
        new Date(client.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    if (renewalFilter === 'overdue') {
      return client.renewalDate && new Date(client.renewalDate) < new Date();
    }
    return true;
  });

  if (isLoading) {
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
              <h1 className="text-2xl font-semibold text-gray-900">Client Management</h1>
              <p className="text-gray-600 mt-1">Manage your client portfolio and policies</p>
            </div>
            <button
              onClick={() => console.log('Create client')}
              className="jira-button-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clientStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="jira-stat-card">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{clientStats.active}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Renewals Due</p>
                <p className="text-2xl font-bold text-gray-900">{clientStats.upcomingRenewals}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Premiums</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(clientStats.totalPremiums)}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commission</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(clientStats.totalCommissions)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="jira-content-card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={renewalFilter}
              onChange={(e) => setRenewalFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Renewals</option>
              <option value="upcoming">Upcoming (30 days)</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {filteredClients.length === 0 ? (
            <div className="col-span-full jira-content-card p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'ALL' || renewalFilter !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Convert your first lead to create a client.'}
              </p>
              <button
                onClick={() => console.log('Create client')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Client
              </button>
            </div>
          ) : (
            filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={() => console.log('Edit:', client.id)}
                onView={() => console.log('View:', client.id)}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}