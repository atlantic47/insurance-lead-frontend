import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Users,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  templateId: string;
  template: {
    id: string;
    name: string;
    status: string;
  };
  targetType: string;
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  scheduledAt?: string;
  sendingSpeed: string;
  respectWorkingHours: boolean;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface Template {
  id: string;
  name: string;
  status: string;
  category: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CAMPAIGN_STATUSES = {
  DRAFT: { label: 'Draft', color: 'gray', icon: Edit2 },
  SCHEDULED: { label: 'Scheduled', color: 'blue', icon: Clock },
  RUNNING: { label: 'Running', color: 'green', icon: Play },
  PAUSED: { label: 'Paused', color: 'yellow', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'purple', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'red', icon: XCircle },
};

const TARGET_TYPES = [
  { value: 'SPECIFIC_CONTACTS', label: 'Specific Contacts (CSV Upload)' },
  { value: 'CONTACT_GROUP', label: 'Contact Group' },
  { value: 'ALL_CONTACTS', label: 'All Contacts' },
  { value: 'CUSTOM_FILTER', label: 'Custom Filter' },
];

const SENDING_SPEEDS = [
  { value: 'SLOW', label: 'Slow (1 msg per 5 sec)' },
  { value: 'NORMAL', label: 'Normal (1 msg per 2 sec)' },
  { value: 'FAST', label: 'Fast (1 msg per sec)' },
];

export const CampaignBuilder: React.FC = () => {
  const { token } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    targetType: 'SPECIFIC_CONTACTS',
    contactsList: [] as string[],
    scheduledAt: '',
    sendingSpeed: 'NORMAL',
    respectWorkingHours: true,
    workingHoursStart: 9,
    workingHoursEnd: 18,
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/campaigns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const campaignsData = response.data.campaigns || response.data || [];
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const templatesData = response.data.templates || response.data || [];
      setTemplates(Array.isArray(templatesData) ? templatesData.filter((t: Template) => t.status === 'APPROVED') : []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    }
  };

  const fetchCampaignStats = async (campaignId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/campaigns/${campaignId}/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Campaign name is required');
      return;
    }

    if (!formData.templateId) {
      alert('Please select a template');
      return;
    }

    if (formData.targetType === 'SPECIFIC_CONTACTS' && formData.contactsList.length === 0) {
      alert('Please add at least one contact');
      return;
    }

    try {
      const payload = {
        ...formData,
        scheduledAt: formData.scheduledAt || undefined,
      };

      if (editingCampaign) {
        await axios.patch(
          `${API_BASE_URL}/whatsapp/campaigns/${editingCampaign.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${API_BASE_URL}/whatsapp/campaigns`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchCampaigns();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      alert(error.response?.data?.message || 'Failed to save campaign');
    }
  };

  const startCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to start this campaign?')) {
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/whatsapp/campaigns/${campaignId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCampaigns();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start campaign');
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      await axios.post(
        `${API_BASE_URL}/whatsapp/campaigns/${campaignId}/pause`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCampaigns();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to pause campaign');
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/whatsapp/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCampaigns();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      templateId: campaign.templateId,
      targetType: campaign.targetType,
      contactsList: [],
      scheduledAt: campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        : '',
      sendingSpeed: campaign.sendingSpeed,
      respectWorkingHours: campaign.respectWorkingHours,
      workingHoursStart: 9,
      workingHoursEnd: 18,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      templateId: '',
      targetType: 'SPECIFIC_CONTACTS',
      contactsList: [],
      scheduledAt: '',
      sendingSpeed: 'NORMAL',
      respectWorkingHours: true,
      workingHoursStart: 9,
      workingHoursEnd: 18,
    });
  };

  const handleContactsInput = (text: string) => {
    const contacts = text
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    setFormData({ ...formData, contactsList: contacts });
  };

  const viewStats = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    fetchCampaignStats(campaign.id);
  };

  const getStatusConfig = (status: string) => {
    return CAMPAIGN_STATUSES[status as keyof typeof CAMPAIGN_STATUSES] || CAMPAIGN_STATUSES.DRAFT;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Create and manage marketing campaigns with WhatsApp templates
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Campaign
        </button>
      </div>

      {templates.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">No Approved Templates</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need at least one APPROVED WhatsApp template to create campaigns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((campaign) => {
          const statusConfig = getStatusConfig(campaign.status);
          const StatusIcon = statusConfig.icon;
          const progress =
            campaign.totalContacts > 0
              ? (campaign.sentCount / campaign.totalContacts) * 100
              : 0;

          return (
            <div
              key={campaign.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {campaign.name}
                  </h3>
                  {campaign.description && (
                    <p className="text-sm text-gray-600">{campaign.description}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full bg-${statusConfig.color}-100 text-${statusConfig.color}-800 flex items-center`}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </span>
              </div>

              {campaign.template.status !== 'APPROVED' && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  ⚠️ Template is not approved
                </div>
              )}

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {campaign.sentCount} / {campaign.totalContacts}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Sent</div>
                  <div className="font-semibold text-blue-600">{campaign.sentCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Delivered</div>
                  <div className="font-semibold text-green-600">
                    {campaign.deliveredCount}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Read</div>
                  <div className="font-semibold text-purple-600">{campaign.readCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Failed</div>
                  <div className="font-semibold text-red-600">{campaign.failedCount}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Template: <span className="font-medium">{campaign.template.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {campaign.status === 'DRAFT' && (
                    <button
                      onClick={() => startCampaign(campaign.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Start Campaign"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  )}
                  {campaign.status === 'RUNNING' && (
                    <button
                      onClick={() => pauseCampaign(campaign.id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Pause Campaign"
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => viewStats(campaign)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Stats"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  {campaign.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first campaign to start sending WhatsApp templates in bulk
          </p>
          {templates.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Campaign
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Summer Promotion 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Describe your campaign..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Template * (Only Approved)
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Type *
                </label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {TARGET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.targetType === 'SPECIFIC_CONTACTS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contacts (Phone Numbers) *
                  </label>
                  <textarea
                    onChange={(e) => handleContactsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={6}
                    placeholder="Enter phone numbers (one per line or comma-separated)&#10;+1234567890&#10;+9876543210&#10;..."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.contactsList.length} contacts added
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty to start manually
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sending Speed
                </label>
                <select
                  value={formData.sendingSpeed}
                  onChange={(e) => setFormData({ ...formData, sendingSpeed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {SENDING_SPEEDS.map((speed) => (
                    <option key={speed.value} value={speed.value}>
                      {speed.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.respectWorkingHours}
                    onChange={(e) =>
                      setFormData({ ...formData, respectWorkingHours: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Respect working hours (9 AM - 6 PM)
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Campaign Statistics</h2>
              <button
                onClick={() => {
                  setSelectedCampaign(null);
                  setStats(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">{selectedCampaign.name}</h3>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-700">Total Contacts</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {stats.totalContacts}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-700">Sent</div>
                      <div className="text-2xl font-bold text-green-900">{stats.sentCount}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-purple-700">Delivered</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {stats.deliveredCount}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-700">Failed</div>
                      <div className="text-2xl font-bold text-red-900">{stats.failedCount}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Delivery Rate:</span>
                      <span className="font-semibold">{stats.deliveryRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Read Rate:</span>
                      <span className="font-semibold">{stats.readRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
