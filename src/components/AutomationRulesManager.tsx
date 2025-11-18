import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff, Zap, Clock, Tag as TagIcon, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth';

interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: string;
  triggerConditions: any;
  templateId: string;
  template: {
    id: string;
    name: string;
    status: string;
  };
  templateParams: any;
  sendingFrequency: string;
  maxSendCount?: number;
  sendAfterMinutes: number;
  activeDays?: number[];
  activeHoursStart?: number;
  activeHoursEnd?: number;
  _count?: {
    executionLogs: number;
  };
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  status: string;
  category: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TRIGGER_TYPES = [
  { value: 'CONVERSATION_WINDOW_EXPIRED', label: 'Conversation Window Expired', icon: Clock },
  { value: 'LABEL_ASSIGNED', label: 'Label Assigned', icon: TagIcon },
  { value: 'TIME_DELAY', label: 'Time Delay', icon: Clock },
];

const SENDING_FREQUENCIES = [
  { value: 'ONCE', label: 'Once Only' },
  { value: 'EVERY_WINDOW', label: 'Every 24 Hours' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AutomationRulesManager: React.FC = () => {
  const { token } = useAuthStore();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    triggerType: 'CONVERSATION_WINDOW_EXPIRED',
    triggerConditions: {} as any,
    templateId: '',
    sendingFrequency: 'ONCE',
    maxSendCount: undefined as number | undefined,
    sendAfterMinutes: 0,
    activeDays: [] as number[],
    activeHoursStart: undefined as number | undefined,
    activeHoursEnd: undefined as number | undefined,
  });

  useEffect(() => {
    fetchRules();
    fetchTemplates();
    fetchLabels();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/automation-rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRules(response.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Only show APPROVED templates
      setTemplates(response.data.templates.filter((t: Template) => t.status === 'APPROVED'));
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLabels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp/conversation-labels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLabels(response.data);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Rule name is required');
      return;
    }

    if (!formData.templateId) {
      alert('Please select a template');
      return;
    }

    // Validate trigger conditions based on type
    if (formData.triggerType === 'LABEL_ASSIGNED' && !formData.triggerConditions.labelId) {
      alert('Please select a label for this trigger');
      return;
    }

    try {
      const payload = {
        ...formData,
        maxSendCount: formData.maxSendCount || undefined,
        activeHoursStart: formData.activeHoursStart ?? undefined,
        activeHoursEnd: formData.activeHoursEnd ?? undefined,
      };

      if (editingRule) {
        await axios.patch(
          `${API_BASE_URL}/whatsapp/automation-rules/${editingRule.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/whatsapp/automation-rules`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchRules();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving rule:', error);
      alert(error.response?.data?.message || 'Failed to save automation rule');
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/whatsapp/automation-rules/${ruleId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRules();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update rule status');
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/whatsapp/automation-rules/${ruleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRules();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete rule');
    }
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      isActive: rule.isActive,
      triggerType: rule.triggerType,
      triggerConditions: rule.triggerConditions || {},
      templateId: rule.templateId,
      sendingFrequency: rule.sendingFrequency,
      maxSendCount: rule.maxSendCount,
      sendAfterMinutes: rule.sendAfterMinutes,
      activeDays: rule.activeDays || [],
      activeHoursStart: rule.activeHoursStart,
      activeHoursEnd: rule.activeHoursEnd,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
      triggerType: 'CONVERSATION_WINDOW_EXPIRED',
      triggerConditions: {},
      templateId: '',
      sendingFrequency: 'ONCE',
      maxSendCount: undefined,
      sendAfterMinutes: 0,
      activeDays: [],
      activeHoursStart: undefined,
      activeHoursEnd: undefined,
    });
  };

  const getTriggerLabel = (type: string) => {
    return TRIGGER_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getFrequencyLabel = (freq: string) => {
    return SENDING_FREQUENCIES.find((f) => f.value === freq)?.label || freq;
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
          <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
          <p className="text-gray-600 mt-1">
            Automate WhatsApp template sending based on triggers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Rule
        </button>
      </div>

      {templates.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900">No Approved Templates</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need at least one APPROVED WhatsApp template to create automation rules.
                Please create and get your templates approved by Meta first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-white rounded-lg border ${
              rule.isActive ? 'border-green-200' : 'border-gray-200'
            } p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                  <span
                    className={`ml-3 px-2 py-1 text-xs font-medium rounded ${
                      rule.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {rule.template.status !== 'APPROVED' && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                      Template Not Approved
                    </span>
                  )}
                </div>
                {rule.description && (
                  <p className="text-gray-600 mb-3">{rule.description}</p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Trigger:</span>
                    <p className="font-medium text-gray-900">
                      {getTriggerLabel(rule.triggerType)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Template:</span>
                    <p className="font-medium text-gray-900">{rule.template.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <p className="font-medium text-gray-900">
                      {getFrequencyLabel(rule.sendingFrequency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Executions:</span>
                    <p className="font-medium text-gray-900">
                      {rule._count?.executionLogs || 0}
                    </p>
                  </div>
                </div>
                {rule.sendAfterMinutes > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Delay: {rule.sendAfterMinutes} minutes after trigger
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => toggleRuleStatus(rule.id, rule.isActive)}
                  className={`p-2 rounded-lg transition-colors ${
                    rule.isActive
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={rule.isActive ? 'Deactivate' : 'Activate'}
                >
                  {rule.isActive ? (
                    <Power className="w-5 h-5" />
                  ) : (
                    <PowerOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(rule)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first automation rule to start sending templates automatically
          </p>
          {templates.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Rule
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
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Follow-up after 24 hours"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Describe what this rule does..."
                  />
                </div>
              </div>

              {/* Trigger Configuration */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Trigger Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trigger Type *
                    </label>
                    <select
                      value={formData.triggerType}
                      onChange={(e) =>
                        setFormData({ ...formData, triggerType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {TRIGGER_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.triggerType === 'LABEL_ASSIGNED' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Label *
                      </label>
                      <select
                        value={formData.triggerConditions.labelId || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            triggerConditions: { labelId: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a label...</option>
                        {labels.map((label) => (
                          <option key={label.id} value={label.id}>
                            {label.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay After Trigger (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.sendAfterMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sendAfterMinutes: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Template Selection */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Template to Send</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Template * (Only Approved Templates)
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
              </div>

              {/* Sending Rules */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Sending Rules</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sending Frequency *
                    </label>
                    <select
                      value={formData.sendingFrequency}
                      onChange={(e) =>
                        setFormData({ ...formData, sendingFrequency: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {SENDING_FREQUENCIES.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Send Count (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxSendCount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxSendCount: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Schedule (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Active Days
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {DAYS_OF_WEEK.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const days = formData.activeDays.includes(index)
                              ? formData.activeDays.filter((d) => d !== index)
                              : [...formData.activeDays, index];
                            setFormData({ ...formData, activeDays: days });
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            formData.activeDays.includes(index)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Active Hours Start
                      </label>
                      <input
                        type="number"
                        value={formData.activeHoursStart ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            activeHoursStart: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        min="0"
                        max="23"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0-23"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Active Hours End
                      </label>
                      <input
                        type="number"
                        value={formData.activeHoursEnd ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            activeHoursEnd: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        min="0"
                        max="23"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0-23"
                      />
                    </div>
                  </div>
                </div>
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
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
