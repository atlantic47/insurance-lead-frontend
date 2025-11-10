'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactGroupsApi, leadsApi } from '@/lib/api';
import { Users, Mail, MessageCircle, Plus, Edit, Trash2, UserPlus, X, Search } from 'lucide-react';

interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  type: 'WHATSAPP' | 'EMAIL' | 'BOTH';
  color?: string;
  _count: { leads: number };
}

export default function ContactsPage() {
  const [selectedType, setSelectedType] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'WHATSAPP' as 'WHATSAPP' | 'EMAIL' | 'BOTH',
    color: '#3B82F6',
  });
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [groupLeads, setGroupLeads] = useState<any[]>([]);

  const queryClient = useQueryClient();

  // Fetch group details when editing
  const { data: editGroupDetails } = useQuery({
    queryKey: ['contact-group', editingGroup?.id],
    queryFn: () => contactGroupsApi.getById(editingGroup!.id).then(res => res.data),
    enabled: !!editingGroup,
  });

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads', { limit: 1000 }],
    queryFn: () => leadsApi.getAll({ limit: 1000 }).then(res => res.data),
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: () => contactGroupsApi.getAll().then(res => res.data),
  });

  const createGroupMutation = useMutation({
    mutationFn: contactGroupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => contactGroupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
      setEditingGroup(null);
      resetForm();
    },
  });

  const addLeadsMutation = useMutation({
    mutationFn: ({ id, leadIds }: { id: string; leadIds: string[] }) =>
      contactGroupsApi.addLeads(id, leadIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-group', editingGroup?.id] });
    },
  });

  const removeLeadMutation = useMutation({
    mutationFn: ({ groupId, leadId }: { groupId: string; leadId: string }) =>
      contactGroupsApi.removeLead(groupId, leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-group', editingGroup?.id] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: contactGroupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'WHATSAPP',
      color: '#3B82F6',
    });
    setSelectedLeads([]);
    setLeadSearch('');
    setGroupLeads([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      // Update group details
      await updateGroupMutation.mutateAsync({
        id: editingGroup.id,
        data: {
          name: formData.name,
          description: formData.description,
          color: formData.color,
        },
      });

      // Add new selected leads if any
      if (selectedLeads.length > 0) {
        await addLeadsMutation.mutateAsync({
          id: editingGroup.id,
          leadIds: selectedLeads,
        });
      }
    } else {
      createGroupMutation.mutate({
        ...formData,
        leadIds: selectedLeads,
      });
    }
  };

  // Load editing group data
  useEffect(() => {
    if (editingGroup && editGroupDetails) {
      setFormData({
        name: editingGroup.name,
        description: editingGroup.description || '',
        type: editingGroup.type,
        color: editingGroup.color || '#3B82F6',
      });
      // Load existing leads in the group
      const existingLeads = editGroupDetails.leads?.map((l: any) => l.lead) || [];
      setGroupLeads(existingLeads);
    }
  }, [editingGroup, editGroupDetails]);

  // Filter leads based on group type
  const existingLeadIds = groupLeads.map(l => l.id);
  const availableLeads = (leadsResponse?.data || []).filter((lead: any) => {
    // Don't show leads already in the group when editing
    if (editingGroup && existingLeadIds.includes(lead.id)) return false;

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
    if (formData.type === 'WHATSAPP') {
      return lead.source === 'WHATSAPP' || lead.phone;
    } else if (formData.type === 'EMAIL') {
      return lead.source === 'EMAIL' || lead.email;
    }
    return true; // BOTH type shows all leads
  });

  const filteredGroups = groups.filter((group: ContactGroup) => {
    if (selectedType === 'ALL') return true;
    return group.type === selectedType || group.type === 'BOTH';
  });

  const getTypeIcon = (type: string) => {
    if (type === 'WHATSAPP') return <MessageCircle className="w-4 h-4 text-green-600" />;
    if (type === 'EMAIL') return <Mail className="w-4 h-4 text-blue-600" />;
    return <Users className="w-4 h-4 text-purple-600" />;
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

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Groups</h1>
            <p className="text-gray-600 mt-1">Manage WhatsApp and Email contact lists for campaigns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedType === 'ALL'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Groups ({groups.length})
            </button>
            <button
              onClick={() => setSelectedType('WHATSAPP')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                selectedType === 'WHATSAPP'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp ({groups.filter((g: ContactGroup) => g.type === 'WHATSAPP' || g.type === 'BOTH').length})
            </button>
            <button
              onClick={() => setSelectedType('EMAIL')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                selectedType === 'EMAIL'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email ({groups.filter((g: ContactGroup) => g.type === 'EMAIL' || g.type === 'BOTH').length})
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group: ContactGroup) => (
            <div
              key={group.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: group.color || '#3B82F6' }}
                  >
                    {getTypeIcon(group.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getTypeColor(group.type)}`}>
                      {group.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this group?')) {
                        deleteGroupMutation.mutate(group.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {group.description && (
                <p className="text-sm text-gray-600 mb-4">{group.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  {group._count.leads} contacts
                </div>
                <button
                  onClick={() => {
                    // Navigate to group details
                    window.location.href = `/contacts/${group.id}`;
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No contact groups found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingGroup) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingGroup ? 'Edit Contact Group' : 'Create Contact Group'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingGroup(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Group Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => {
                        setFormData({ ...formData, type: e.target.value as any });
                        setSelectedLeads([]); // Reset selected leads when type changes
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!!editingGroup}
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                      <option value="BOTH">Both</option>
                    </select>
                    {editingGroup && (
                      <p className="text-xs text-gray-500 mt-1">Type cannot be changed when editing</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Lead Selection */}
                <div>
                  {editingGroup && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Contacts ({groupLeads.length})
                      </label>
                      <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                        {groupLeads.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No contacts in this group yet</p>
                        ) : (
                          <div className="space-y-2">
                            {groupLeads.map((lead: any) => (
                              <div key={lead.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {lead.firstName} {lead.lastName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {lead.email || lead.phone}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Remove this contact from the group?')) {
                                      removeLeadMutation.mutate({ groupId: editingGroup.id, leadId: lead.id });
                                      setGroupLeads(groupLeads.filter(l => l.id !== lead.id));
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingGroup ? 'Add More Contacts' : 'Select Contacts'} ({selectedLeads.length} selected)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="mb-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search leads..."
                          value={leadSearch}
                          onChange={(e) => setLeadSearch(e.target.value)}
                          className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
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
                        <p className="text-sm text-gray-500 text-center py-4">
                          {editingGroup
                            ? 'No more contacts available to add'
                            : `No leads available for ${formData.type} group`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingGroup(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingGroup
                    ? (updateGroupMutation.isPending ? 'Updating...' : 'Update Group')
                    : (createGroupMutation.isPending ? 'Creating...' : 'Create Group')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
