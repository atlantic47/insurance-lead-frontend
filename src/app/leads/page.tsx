'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LeadPipeline from '@/components/leads/LeadPipeline';
import CreateLeadModal from '@/components/leads/CreateLeadModal';
import LeadDetailsModal from '@/components/leads/LeadDetailsModal';
import EditLeadModal from '@/components/leads/EditLeadModal';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, tasksApi } from '@/lib/api';
import { Lead } from '@/types';
import { getStatusColor, formatDate } from '@/lib/utils';
import { Filter, Search, Download, Eye, Edit, MessageCircle, Mail, MoreVertical, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeadsPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedLeadForTask, setSelectedLeadForTask] = useState<Lead | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('list');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    insuranceType: '',
  });

  const queryClient = useQueryClient();
  const router = useRouter();

  // Debounced search - update search term after 500ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ['leads', { search: searchTerm, page: currentPage, limit: pageSize, ...filters }],
    queryFn: () => leadsApi.getAll({
      search: searchTerm,
      page: currentPage,
      limit: pageSize,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...(filters.status && { status: filters.status }),
      ...(filters.source && { source: filters.source }),
      ...(filters.insuranceType && { insuranceType: filters.insuranceType }),
    }).then(res => res.data),
  });

  const createLeadMutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => leadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditModalOpen(false);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateTaskModalOpen(false);
      setSelectedLeadForTask(null);
    },
  });

  const handleCreateLead = async (data: any) => {
    await createLeadMutation.mutateAsync(data);
  };

  const handleCreateTask = async (data: any) => {
    await createTaskMutation.mutateAsync(data);
  };

  const handleUpdateLead = async (id: string, data: any) => {
    await updateLeadMutation.mutateAsync({ id, data });
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const handleEditLead = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  const handleViewLead = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const handleGoToWhatsApp = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/chat?leadId=${lead.id}`);
  };

  const handleGoToEmail = (lead: Lead, e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/communications?leadId=${lead.id}&channel=EMAIL`);
  };

  const handleExport = () => {
    const csvHeaders = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Type', 'Score', 'Created'];
    const csvRows = leads.map(lead => [
      `${lead.firstName} ${lead.lastName}`,
      lead.email || '',
      lead.phone || '',
      lead.source,
      lead.status,
      lead.insuranceType,
      lead.score.toFixed(1),
      formatDate(lead.createdAt)
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', source: '', insuranceType: '' });
    setCurrentPage(1);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getSourceBadgeColor = (source: string) => {
    const colorMap: Record<string, string> = {
      'EMAIL': 'bg-gray-100 text-gray-800',
      'WEBSITE': 'bg-blue-100 text-blue-800',
      'REFERRAL': 'bg-green-100 text-green-800',
      'SOCIAL_MEDIA': 'bg-purple-100 text-purple-800',
      'PHONE': 'bg-yellow-100 text-yellow-800',
      'WHATSAPP': 'bg-emerald-100 text-emerald-800',
      'WALK_IN': 'bg-orange-100 text-orange-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };
    return colorMap[source] || 'bg-gray-100 text-gray-800';
  };

  const getPipelineBadgeColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'NEW': 'bg-blue-100 text-blue-800',
      'CONTACTED': 'bg-cyan-100 text-cyan-800',
      'ENGAGED': 'bg-purple-100 text-purple-800',
      'QUALIFIED': 'bg-indigo-100 text-indigo-800',
      'PROPOSAL_SENT': 'bg-orange-100 text-orange-800',
      'NEGOTIATION': 'bg-yellow-100 text-yellow-800',
      'CLOSED_WON': 'bg-green-100 text-green-800',
      'CLOSED_LOST': 'bg-red-100 text-red-800',
      'FOLLOW_UP': 'bg-gray-100 text-gray-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const leads = leadsResponse?.data || [];
  const totalCount = leadsResponse?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
            <p className="text-gray-600 mt-1">Manage your lead pipeline and track progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'pipeline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pipeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="ENGAGED">Engaged</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="CLOSED_WON">Closed Won</option>
                  <option value="CLOSED_LOST">Closed Lost</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sources</option>
                  <option value="WEBSITE">Website</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="WALK_IN">Walk In</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Type</label>
                <select
                  value={filters.insuranceType}
                  onChange={(e) => handleFilterChange('insuranceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="AUTO">Auto</option>
                  <option value="HOME">Home</option>
                  <option value="LIFE">Life</option>
                  <option value="HEALTH">Health</option>
                  <option value="BUSINESS">Business</option>
                  <option value="RENTERS">Renters</option>
                  <option value="UMBRELLA">Umbrella</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Total Leads:</span> {totalCount}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">New:</span> {leads.filter(l => l.status === 'NEW').length}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Qualified:</span> {leads.filter(l => l.status === 'QUALIFIED').length}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Closed Won:</span> {leads.filter(l => l.status === 'CLOSED_WON').length}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Conversion Rate:</span> {totalCount > 0 ? Math.round((leads.filter(l => l.status === 'CLOSED_WON').length / totalCount) * 100) : 0}%
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">WhatsApp:</span> {leads.filter(l => l.source === 'WHATSAPP').length}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Email:</span> {leads.filter(l => l.source === 'EMAIL' || l.preferredContact === 'EMAIL').length}
              </span>
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pipeline Stage
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full ${getAvatarColor(lead.firstName)} flex items-center justify-center`}>
                                <span className="text-sm font-semibold text-white">
                                  {lead.firstName.charAt(0).toUpperCase()}{lead.lastName.charAt(0).toUpperCase()}
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
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-md ${getSourceBadgeColor(lead.source)}`}>
                            {lead.source.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-md ${getPipelineBadgeColor(lead.status)}`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.insuranceType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {lead.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lead.score.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === lead.id ? null : lead.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {openDropdownId === lead.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenDropdownId(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        handleViewLead(lead, e);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <Eye className="w-4 h-4 mr-3 text-blue-600" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        handleEditLead(lead, e);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <Edit className="w-4 h-4 mr-3 text-gray-600" />
                                      Edit Lead
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        handleGoToWhatsApp(lead, e);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <MessageCircle className="w-4 h-4 mr-3 text-green-600" />
                                      WhatsApp
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        handleGoToEmail(lead, e);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <Mail className="w-4 h-4 mr-3 text-indigo-600" />
                                      Email
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLeadForTask(lead);
                                        setIsCreateTaskModalOpen(true);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <CheckSquare className="w-4 h-4 mr-3 text-orange-600" />
                                      Create Task
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {leads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} leads
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-4 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
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

        <EditLeadModal
          lead={selectedLead}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateLead}
          isLoading={updateLeadMutation.isPending}
        />

        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => {
            setIsCreateTaskModalOpen(false);
            setSelectedLeadForTask(null);
          }}
          selectedLead={selectedLeadForTask || undefined}
          onSubmit={handleCreateTask}
          isLoading={createTaskMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}