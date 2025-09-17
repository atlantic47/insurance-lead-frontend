'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadPipeline from '@/components/leads/LeadPipeline';
import CreateLeadModal from '@/components/leads/CreateLeadModal';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { Lead } from '@/types';
import { getStatusColor, formatDate } from '@/lib/utils';
import { Filter, Search, Download } from 'lucide-react';

export default function LeadsPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  const queryClient = useQueryClient();

  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['leads', { search: searchTerm }],
    queryFn: () => leadsApi.getAll({ 
      search: searchTerm,
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }).then(res => res.data),
  });

  const createLeadMutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateModalOpen(false);
    },
  });

  const handleCreateLead = async (data: any) => {
    await createLeadMutation.mutateAsync(data);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const leads = leadsResponse?.data || [];

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
      <div className="jira-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Leads Management</h1>
            <p className="text-gray-600 mt-1">Manage your lead pipeline and track progress</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-3 py-2 text-sm font-medium border ${
                  viewMode === 'pipeline'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } rounded-l-md`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium border-t border-r border-b ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } rounded-r-md`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="jira-page-content">
        <div className="jira-content-card p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Total Leads: {leads.length}</span>
            <div className="flex items-center space-x-4">
              <span>New: {leads.filter(l => l.status === 'NEW').length}</span>
              <span>Qualified: {leads.filter(l => l.status === 'QUALIFIED').length}</span>
              <span>Closed Won: {leads.filter(l => l.status === 'CLOSED_WON').length}</span>
              <span>Conversion Rate: {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'CLOSED_WON').length / leads.length) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {viewMode === 'pipeline' ? (
          <LeadPipeline
            leads={leads}
            onLeadClick={handleLeadClick}
            onCreateLead={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="jira-content-card">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => handleLeadClick(lead)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {lead.firstName} {lead.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.insuranceType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.score.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateLead}
          isLoading={createLeadMutation.isPending}
        />

        <LeadDetailsModal
          lead={selectedLead}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}