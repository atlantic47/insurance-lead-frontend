'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactGroupsApi, leadsApi } from '@/lib/api';
import { ArrowLeft, Users, Mail, MessageCircle, UserPlus, Trash2, X, Search } from 'lucide-react';

export default function ContactGroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const queryClient = useQueryClient();

  const [showAddLeadsModal, setShowAddLeadsModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [leadSearch, setLeadSearch] = useState('');

  const { data: group, isLoading } = useQuery({
    queryKey: ['contact-group', groupId],
    queryFn: () => contactGroupsApi.getById(groupId).then(res => res.data),
  });

  const { data: allLeadsResponse } = useQuery({
    queryKey: ['leads', { limit: 1000 }],
    queryFn: () => leadsApi.getAll({ limit: 1000 }).then(res => res.data),
  });

  const addLeadsMutation = useMutation({
    mutationFn: (leadIds: string[]) => contactGroupsApi.addLeads(groupId, leadIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-group', groupId] });
      setShowAddLeadsModal(false);
      setSelectedLeads([]);
      setLeadSearch('');
    },
  });

  const removeLeadMutation = useMutation({
    mutationFn: (leadId: string) => contactGroupsApi.removeLead(groupId, leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-group', groupId] });
    },
  });

  const getTypeIcon = (type: string) => {
    if (type === 'WHATSAPP') return <MessageCircle className="w-5 h-5 text-green-600" />;
    if (type === 'EMAIL') return <Mail className="w-5 h-5 text-blue-600" />;
    return <Users className="w-5 h-5 text-purple-600" />;
  };

  const getTypeColor = (type: string) => {
    if (type === 'WHATSAPP') return 'bg-green-100 text-green-800';
    if (type === 'EMAIL') return 'bg-blue-100 text-blue-800';
    return 'bg-purple-100 text-purple-800';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Contact group not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const existingLeadIds = group.leads?.map((l: any) => l.leadId) || [];
  const availableLeads = (allLeadsResponse?.data || []).filter((lead: any) => {
    // Filter out leads already in the group
    if (existingLeadIds.includes(lead.id)) return false;

    // Search filter
    if (leadSearch) {
      const searchLower = leadSearch.toLowerCase();
      const matchesSearch =
        lead.firstName?.toLowerCase().includes(searchLower) ||
        lead.lastName?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (group.type === 'WHATSAPP') {
      return lead.source === 'WHATSAPP' || lead.phone;
    } else if (group.type === 'EMAIL') {
      return lead.source === 'EMAIL' || lead.email;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => router.push('/contacts')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contact Groups
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: group.color || '#3B82F6' }}
              >
                {getTypeIcon(group.type)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                {group.description && (
                  <p className="text-gray-600 mt-1">{group.description}</p>
                )}
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getTypeColor(group.type)}`}>
                    {group.type}
                  </span>
                  <span className="text-sm text-gray-500">
                    {group.leads?.length || 0} contacts
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddLeadsModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contacts
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {group.leads?.map((item: any) => (
                  <tr key={item.leadId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {item.lead.firstName} {item.lead.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lead.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.lead.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded">
                        {item.lead.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {item.lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          if (confirm('Remove this contact from the group?')) {
                            removeLeadMutation.mutate(item.leadId);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!group.leads || group.leads.length === 0) && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No contacts in this group yet</p>
                <button
                  onClick={() => setShowAddLeadsModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Leads Modal */}
      {showAddLeadsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Add Contacts to Group</h2>
              <button
                onClick={() => {
                  setShowAddLeadsModal(false);
                  setSelectedLeads([]);
                  setLeadSearch('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {availableLeads.map((lead: any) => (
                  <label
                    key={lead.id}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeads([...selectedLeads, lead.id]);
                        } else {
                          setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.email || lead.phone}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {lead.source}
                    </span>
                  </label>
                ))}

                {availableLeads.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    {leadSearch ? 'No contacts found matching your search' : 'No more contacts available to add'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                {selectedLeads.length} contact{selectedLeads.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddLeadsModal(false);
                    setSelectedLeads([]);
                    setLeadSearch('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addLeadsMutation.mutate(selectedLeads)}
                  disabled={selectedLeads.length === 0 || addLeadsMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addLeadsMutation.isPending ? 'Adding...' : `Add ${selectedLeads.length} Contact${selectedLeads.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
