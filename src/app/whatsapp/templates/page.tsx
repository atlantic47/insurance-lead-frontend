'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api';
import {
  Plus,
  MessageCircle,
  Edit,
  Trash2,
  X,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import WhatsAppTemplateModal from '@/components/WhatsAppTemplateModal';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  headerFormat?: string;
  headerText?: string;
  body: string;
  footer?: string;
  buttons?: any;
  status: string;
  metaTemplateId?: string;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt: string;
}

export default function WhatsAppTemplatesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['whatsapp-templates', selectedStatus, page],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      const response = await whatsappApi.getTemplates(params);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => whatsappApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => whatsappApi.submitTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: (id: string) => whatsappApi.resubmitTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
  });

  const checkStatusMutation = useMutation({
    mutationFn: (id: string) => whatsappApi.getTemplateStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => whatsappApi.syncTemplates(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      alert(data.data.message || 'Templates synced successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to sync templates');
    },
  });

  const handleSync = () => {
    if (confirm('Sync existing templates from Facebook? This will fetch all templates from your WhatsApp Business Account.')) {
      syncMutation.mutate();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (id: string) => {
    if (confirm('Submit this template to Meta for approval?')) {
      submitMutation.mutate(id);
    }
  };

  const handleResubmit = (id: string) => {
    if (confirm('Resubmit this template to Meta for approval? This will submit the updated template.')) {
      resubmitMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-700', icon: FileText, text: 'Draft' },
      PENDING: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, text: 'Pending' },
      APPROVED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Rejected' },
    };

    const badge = badges[status] || badges.DRAFT;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
            <p className="text-gray-600 mt-1">
              Create and manage Meta-approved WhatsApp message templates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Existing Templates'}
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedStatus === status
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {status === 'ALL' ? 'All Templates' : status.charAt(0) + status.slice(1).toLowerCase()}
                {templatesData?.templates && status !== 'ALL' && (
                  <span className="ml-2 text-xs">
                    ({templatesData.templates.filter((t: WhatsAppTemplate) => t.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Templates List */}
        {templatesData?.templates && templatesData.templates.length > 0 ? (
          <div className="space-y-4">
            {templatesData.templates.map((template: WhatsAppTemplate) => (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">
                          {template.category} • {template.language}
                        </p>
                      </div>
                      {getStatusBadge(template.status)}
                    </div>

                    {/* Template Preview */}
                    <div className="ml-13 space-y-3">
                      {template.headerFormat && template.headerText && (
                        <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-500">
                          <p className="text-xs text-gray-500 mb-1">Header ({template.headerFormat})</p>
                          <p className="text-sm font-medium text-gray-900">{template.headerText}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Body</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.body}</p>
                      </div>

                      {template.footer && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Footer</p>
                          <p className="text-xs text-gray-600">{template.footer}</p>
                        </div>
                      )}

                      {template.buttons && JSON.parse(template.buttons).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">Buttons</p>
                          <div className="flex flex-wrap gap-2">
                            {JSON.parse(template.buttons).map((button: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1.5 bg-white border border-green-500 text-green-700 rounded-lg text-sm font-medium"
                              >
                                {button.text}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {template.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
                          <p className="text-sm text-red-700">{template.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {template.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSubmit(template.id)}
                        disabled={submitMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Send className="w-3 h-3 mr-1.5" />
                        Submit to Meta
                      </button>
                    )}

                    {template.status === 'REJECTED' && (
                      <button
                        onClick={() => handleResubmit(template.id)}
                        disabled={resubmitMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3 mr-1.5" />
                        Resubmit to Meta
                      </button>
                    )}

                    {(template.status === 'PENDING' || template.status === 'APPROVED') && (
                      <button
                        onClick={() => checkStatusMutation.mutate(template.id)}
                        disabled={checkStatusMutation.isPending}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Clock className="w-3 h-3 mr-1.5" />
                        Check Status
                      </button>
                    )}

                    {(template.status === 'DRAFT' || template.status === 'REJECTED') && (
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                      >
                        <Edit className="w-3 h-3 mr-1.5" />
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(template.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                  <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                  {template.metaTemplateId && (
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      ID: {template.metaTemplateId}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">Create your first WhatsApp template to get started</p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </button>
          </div>
        )}

        {/* Pagination */}
        {templatesData?.pagination && templatesData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {(templatesData.pagination.page - 1) * templatesData.pagination.limit + 1} to{' '}
              {Math.min(
                templatesData.pagination.page * templatesData.pagination.limit,
                templatesData.pagination.total
              )}{' '}
              of {templatesData.pagination.total} templates
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= templatesData.pagination.totalPages}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {(isCreating || editingTemplate) && (
        <WhatsAppTemplateModal
          template={editingTemplate}
          onClose={() => {
            setIsCreating(false);
            setEditingTemplate(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
            setIsCreating(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
