'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, contactGroupsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  Plus, Mail, MessageCircle, Send, Edit, Trash2, Calendar,
  CheckCircle, XCircle, Clock, Loader, X, FileText, Megaphone, Users
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'WHATSAPP' | 'EMAIL';
  status: string;
  templateId?: string;
  template?: { name: string };
  subject?: string;
  content?: string;
  contactGroupId: string;
  contactGroup: { name: string };
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export default function CampaignsPage() {
  const [selectedType, setSelectedType] = useState<'WHATSAPP' | 'EMAIL' | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string | 'ALL'>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignType, setSelectedCampaignType] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', selectedType, selectedStatus],
    queryFn: async () => {
      const params: any = {};
      if (selectedType !== 'ALL') params.type = selectedType;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      const response = await campaignsApi.getAll(params);
      return response.data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ['campaign-templates', selectedCampaignType],
    queryFn: async () => {
      const response = await campaignsApi.getAllTemplates({ type: selectedCampaignType });
      return response.data;
    },
    enabled: isCreating || !!editingCampaign,
  });

  const { data: contactGroups } = useQuery({
    queryKey: ['contact-groups'],
    queryFn: async () => {
      const response = await contactGroupsApi.getAll();
      return response.data;
    },
    enabled: isCreating || !!editingCampaign,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => campaignsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => campaignsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setEditingCampaign(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as 'WHATSAPP' | 'EMAIL',
      templateId: formData.get('templateId') as string || undefined,
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
      contactGroupId: formData.get('contactGroupId') as string,
      scheduledAt: formData.get('scheduledAt') as string || undefined,
    };

    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSend = (id: string) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      sendMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'SENDING':
      case 'SENT':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'SENDING':
      case 'SENT':
        return 'bg-blue-100 text-blue-700';
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredContactGroups = contactGroups?.filter((group: any) => {
    if (selectedCampaignType === 'WHATSAPP') {
      return group.type === 'WHATSAPP' || group.type === 'BOTH';
    } else {
      return group.type === 'EMAIL' || group.type === 'BOTH';
    }
  });

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
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Create and manage your marketing campaigns across WhatsApp and Email</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/campaigns/templates')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </button>
          </div>
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
              All Campaigns
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
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedType('EMAIL')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                selectedType === 'EMAIL'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['ALL', 'DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'COMPLETED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Campaigns List */}
        {campaigns && campaigns.length > 0 ? (
          <div className="space-y-4">
            {campaigns.map((campaign: Campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        campaign.type === 'WHATSAPP' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {campaign.type === 'WHATSAPP' ? (
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Mail className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{campaign.name}</h3>
                        {campaign.description && (
                          <p className="text-sm text-gray-500">{campaign.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(campaign.status)}
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Contact Group</p>
                        <p className="font-medium text-gray-900">{campaign.contactGroup.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Recipients</p>
                        <p className="font-semibold text-gray-900">{campaign.totalRecipients}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sent</p>
                        <p className="font-semibold text-green-600">{campaign.sentCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Failed</p>
                        <p className="font-semibold text-red-600">{campaign.failedCount}</p>
                      </div>
                    </div>

                    {campaign.template && (
                      <p className="text-sm text-gray-500">Template: {campaign.template.name}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {campaign.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        disabled={sendMutation.isPending}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        title="Send Campaign"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {campaign.status === 'DRAFT' && (
                      <button
                        onClick={() => setEditingCampaign(campaign)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
            <p className="text-gray-500 mb-4">Create your first campaign to start reaching your audience</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingCampaign) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingCampaign(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCampaign?.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Summer Promotion 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type *</label>
                  <select
                    name="type"
                    defaultValue={editingCampaign?.type || 'WHATSAPP'}
                    required
                    onChange={(e) => setSelectedCampaignType(e.target.value as 'WHATSAPP' | 'EMAIL')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingCampaign?.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template (Optional)</label>
                <select
                  name="templateId"
                  defaultValue={editingCampaign?.templateId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No template (use custom content)</option>
                  {templates?.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCampaignType === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                  <input
                    type="text"
                    name="subject"
                    defaultValue={editingCampaign?.subject}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email subject line"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (if not using template)</label>
                <textarea
                  name="content"
                  defaultValue={editingCampaign?.content}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Message content... Use {firstName}, {lastName}, {email}, {phone}"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Group *</label>
                <select
                  name="contactGroupId"
                  defaultValue={editingCampaign?.contactGroupId}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a contact group</option>
                  {filteredContactGroups?.map((group: any) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.type}) - {group._count?.leads || 0} contacts
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  defaultValue={editingCampaign?.scheduledAt?.slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingCampaign(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCampaign ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
