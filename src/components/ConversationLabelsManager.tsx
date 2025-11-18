import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, X, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth';

interface ConversationLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSystemLabel: boolean;
  _count?: {
    conversations: number;
  };
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const ConversationLabelsManager: React.FC = () => {
  const { token } = useAuthStore();
  const [labels, setLabels] = useState<ConversationLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<ConversationLabel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
  });

  const predefinedColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/whatsapp/conversation-labels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const labelsData = response.data.labels || response.data || [];
      setLabels(Array.isArray(labelsData) ? labelsData : []);
    } catch (error: any) {
      console.error('Error fetching labels:', error);
      setLabels([]);
      setError(error.response?.data?.message || 'Unable to load labels. The backend API may not be available.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setSaveError('Label name is required');
      return;
    }

    try {
      setSaveError(null);

      if (editingLabel) {
        // Update existing label
        await axios.patch(
          `${API_BASE_URL}/whatsapp/conversation-labels/${editingLabel.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new label
        await axios.post(
          `${API_BASE_URL}/whatsapp/conversation-labels`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchLabels();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving label:', error);
      setSaveError(error.response?.data?.message || 'Unable to save label. The backend API may not be available.');
    }
  };

  const handleDelete = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/whatsapp/conversation-labels/${labelId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchLabels();
    } catch (error: any) {
      console.error('Error deleting label:', error);
      alert(error.response?.data?.message || 'Failed to delete label');
    }
  };

  const handleEdit = (label: ConversationLabel) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color,
      description: label.description || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLabel(null);
    setSaveError(null);
    setFormData({
      name: '',
      color: '#3B82F6',
      description: '',
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Conversation Labels</h1>
          <p className="text-gray-600 mt-1">
            Organize and categorize your WhatsApp conversations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Label
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">{error}</p>
              <button
                onClick={fetchLabels}
                className="text-sm text-yellow-700 underline mt-1 hover:text-yellow-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Labels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labels.map((label) => (
          <div
            key={label.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: label.color }}
                />
                <h3 className="font-semibold text-gray-900">{label.name}</h3>
                {label.isSystemLabel && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                    System
                  </span>
                )}
              </div>
              {!label.isSystemLabel && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(label)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(label.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {label.description && (
              <p className="text-sm text-gray-600 mb-2">{label.description}</p>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <Tag className="w-4 h-4 mr-1" />
              {label._count?.conversations || 0} conversations
            </div>
          </div>
        ))}
      </div>

      {labels.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No labels yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first label to start organizing conversations
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Label
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLabel ? 'Edit Label' : 'Create Label'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <p className="text-sm text-red-800">{saveError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Follow-up Required"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color
                          ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe when to use this label..."
                  maxLength={200}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
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
                  {editingLabel ? 'Update Label' : 'Create Label'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
