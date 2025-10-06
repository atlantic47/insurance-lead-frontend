'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Mail,
  Phone,
  DollarSign,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [renewalFilter, setRenewalFilter] = useState<'ALL' | 'upcoming' | 'overdue'>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (clientId: string) => {
    setOpenMenuId(openMenuId === clientId ? null : clientId);
  };

  const handleViewClient = (clientId: string) => {
    setOpenMenuId(null);
    router.push(`/clients/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    setOpenMenuId(null);
    router.push(`/clients/${clientId}/edit`);
  };

  const handleDeleteClient = (clientId: string) => {
    setOpenMenuId(null);
    if (confirm('Are you sure you want to delete this client?')) {
      // TODO: Implement delete functionality
      console.log('Delete client:', clientId);
    }
  };

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
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </button>
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Filters */}
        <div className="jira-content-card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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

        {/* Clients List */}
        <div className="jira-content-card">
          {filteredClients.length === 0 ? (
            <div className="p-12 text-center">
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
            <div className="overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="col-span-3">Client</div>
                  <div className="col-span-2">Contact</div>
                  <div className="col-span-2">Policy Details</div>
                  <div className="col-span-2">Premium</div>
                  <div className="col-span-2">Renewal Date</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Client Info */}
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                              {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                client.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {client.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-2">
                        <div className="text-sm text-gray-900 flex items-center gap-1 mb-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{client.email || 'N/A'}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{client.phone || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Policy Details */}
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {client.policyNumber || 'No Policy'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {typeof client.product === 'object' && client.product !== null
                            ? (client.product as any).name || 'No Product'
                            : client.product || 'No Product'}
                        </div>
                      </div>

                      {/* Premium */}
                      <div className="col-span-2">
                        <div className="text-sm font-semibold text-gray-900">
                          {client.premium ? formatCurrency(client.premium) : 'N/A'}
                        </div>
                        {client.commission && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(client.commission)} comm.
                          </div>
                        )}
                      </div>

                      {/* Renewal Date */}
                      <div className="col-span-2">
                        {client.renewalDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className={`w-4 h-4 ${
                              new Date(client.renewalDate) < new Date()
                                ? 'text-red-500'
                                : new Date(client.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                ? 'text-orange-500'
                                : 'text-gray-400'
                            }`} />
                            <span className={`text-sm ${
                              new Date(client.renewalDate) < new Date()
                                ? 'text-red-600 font-medium'
                                : new Date(client.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-600'
                            }`}>
                              {formatDate(client.renewalDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No renewal</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 text-right">
                        <div className="relative inline-block text-left" ref={openMenuId === client.id ? menuRef : null}>
                          <button
                            onClick={() => toggleMenu(client.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="More actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === client.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu">
                                <button
                                  onClick={() => handleViewClient(client.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <Eye className="w-4 h-4 mr-3 text-blue-600" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleEditClient(client.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  <Edit className="w-4 h-4 mr-3 text-gray-600" />
                                  Edit Client
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  role="menuitem"
                                >
                                  <Trash2 className="w-4 h-4 mr-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination info */}
        {filteredClients.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredClients.length}</span> client{filteredClients.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const clientData = {
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  address: formData.get('address') as string,
                  policyNumber: formData.get('policyNumber') as string,
                  premium: parseFloat(formData.get('premium') as string) || 0,
                  commission: parseFloat(formData.get('commission') as string) || 0,
                  startDate: formData.get('startDate') as string,
                  renewalDate: formData.get('renewalDate') as string,
                  notes: formData.get('notes') as string,
                };

                clientsApi.create(clientData)
                  .then(() => {
                    alert('Client added successfully!');
                    setShowAddModal(false);
                    window.location.reload();
                  })
                  .catch((error) => {
                    alert('Failed to add client: ' + error.message);
                  });
              }}
              className="p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Policy Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    name="policyNumber"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Premium */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Premium
                  </label>
                  <input
                    type="number"
                    name="premium"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Commission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission
                  </label>
                  <input
                    type="number"
                    name="commission"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Renewal Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Renewal Date
                  </label>
                  <input
                    type="date"
                    name="renewalDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
