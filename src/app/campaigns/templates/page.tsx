'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { Plus, Mail, MessageCircle, Edit, Trash2, X, FileText, Upload, Sparkles, Code } from 'lucide-react';

const EmailBuilder = dynamic(() => import('@/components/EmailBuilder'), { ssr: false });

interface Template {
  id: string;
  name: string;
  description?: string;
  type: 'WHATSAPP' | 'EMAIL';
  subject?: string;
  content: string;
  variables?: any;
  createdAt: string;
}

export default function CampaignTemplatesPage() {
  const [selectedType, setSelectedType] = useState<'WHATSAPP' | 'EMAIL' | 'ALL'>('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPredefined, setShowPredefined] = useState(false);
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingHtmlTemplate, setEditingHtmlTemplate] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['campaign-templates', selectedType],
    queryFn: async () => {
      const params = selectedType !== 'ALL' ? { type: selectedType } : undefined;
      const response = await campaignsApi.getAllTemplates(params);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => campaignsApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => campaignsApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] });
      setEditingTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, data }: { file: File; data: any }) =>
      campaignsApi.uploadHtmlTemplate(file, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-templates'] });
      setIsUploading(false);
      setUploadFile(null);
    },
  });

  const { data: predefinedTemplates } = useQuery({
    queryKey: ['predefined-templates'],
    queryFn: async () => {
      const response = await campaignsApi.getPredefinedEmailTemplates();
      return response.data;
    },
    enabled: showPredefined,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as 'WHATSAPP' | 'EMAIL',
      subject: formData.get('subject') as string,
      content: formData.get('content') as string,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      subject: formData.get('subject') as string,
    };

    uploadMutation.mutate({ file: uploadFile, data });
  };

  const handleUsePredefined = (template: any) => {
    createMutation.mutate({
      name: template.name,
      description: template.description,
      type: 'EMAIL',
      subject: template.subject,
      content: template.htmlContent || '',
      htmlContent: template.htmlContent,
      isHtml: true,
    });
    setShowPredefined(false);
  };

  const handleSaveHtmlTemplate = (data: any) => {
    if (editingHtmlTemplate) {
      updateMutation.mutate({
        id: editingHtmlTemplate.id,
        data: {
          ...data,
          type: 'EMAIL',
          isHtml: true,
        },
      });
      setEditingHtmlTemplate(null);
    } else {
      createMutation.mutate({
        ...data,
        type: 'EMAIL',
        isHtml: true,
      });
    }
    setShowHtmlEditor(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Campaign Templates</h1>
            <p className="text-gray-600 mt-1">Create reusable templates for your WhatsApp and Email campaigns</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPredefined(true)}
              className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Predefined
            </button>
            <button
              onClick={() => setIsUploading(true)}
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
            <button
              onClick={() => setShowHtmlEditor(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              New Email Template
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp Template
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
              All Templates
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

        {/* Templates Grid */}
        {templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template: Template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      template.type === 'WHATSAPP' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {template.type === 'WHATSAPP' ? (
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Mail className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-500">{template.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (template.type === 'EMAIL') {
                          setEditingHtmlTemplate(template);
                          setShowHtmlEditor(true);
                        } else {
                          setEditingTemplate(template);
                        }
                      }}
                      className="text-gray-400 hover:text-blue-600"
                      title={template.type === 'EMAIL' ? 'Edit in Visual Editor' : 'Edit Template'}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {template.subject && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Subject</p>
                    <p className="text-sm font-medium text-gray-700">{template.subject}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm text-gray-700 line-clamp-4">{template.content}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={`px-2 py-1 rounded ${
                    template.type === 'WHATSAPP' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {template.type}
                  </span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">Create your first template to get started</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowHtmlEditor(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Template
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Template
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTemplate?.name}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Welcome Email, Follow-up Message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingTemplate?.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of this template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Type *</label>
                <select
                  name="type"
                  defaultValue={editingTemplate?.type || 'WHATSAPP'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject (Email only)</label>
                <input
                  type="text"
                  name="subject"
                  defaultValue={editingTemplate?.subject}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email subject line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  name="content"
                  defaultValue={editingTemplate?.content}
                  required
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Template content... Use variables like {firstName}, {lastName}, {email}, {phone}"
                />
                <p className="mt-1 text-sm text-gray-500">
                  💡 Available variables: <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{'{firstName}'}</code>,
                  <code className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">{'{lastName}'}</code>,
                  <code className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">{'{email}'}</code>,
                  <code className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">{'{phone}'}</code>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingTemplate(null);
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
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload HTML Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Upload HTML Template</h2>
              <button
                onClick={() => {
                  setIsUploading(false);
                  setUploadFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload HTML File or ZIP Archive *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".html,.htm,.zip"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-1">
                      {uploadFile ? uploadFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">HTML, HTM, or ZIP files (max 10MB)</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Welcome Email, Newsletter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                <input
                  type="text"
                  name="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email subject line"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tips:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>ZIP files should contain index.html or a main HTML file</li>
                  <li>CSS files will be automatically inlined</li>
                  <li>Images will be converted to base64</li>
                  <li>Use variables: {'{firstName}'}, {'{lastName}'}, {'{email}'}, {'{phone}'}</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploading(false);
                    setUploadFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Predefined Templates Modal */}
      {showPredefined && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Predefined Email Templates</h2>
              <button onClick={() => setShowPredefined(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {predefinedTemplates && predefinedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {predefinedTemplates.map((template: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4">
                        <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                        <p className="text-sm text-purple-100 mt-1">{template.description}</p>
                      </div>
                      <div className="p-6">
                        <p className="text-sm text-gray-600 mb-4">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                          <div
                            className="text-xs"
                            dangerouslySetInnerHTML={{ __html: template.htmlContent.substring(0, 500) + '...' }}
                          />
                        </div>
                        <button
                          onClick={() => handleUsePredefined(template)}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Use This Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading predefined templates...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HTML Template Editor */}
      {showHtmlEditor && (
        <EmailBuilder
          initialHtml={editingHtmlTemplate?.htmlContent || ''}
          initialName={editingHtmlTemplate?.name || ''}
          initialSubject={editingHtmlTemplate?.subject || ''}
          initialDescription={editingHtmlTemplate?.description || ''}
          onSave={handleSaveHtmlTemplate}
          onClose={() => {
            setShowHtmlEditor(false);
            setEditingHtmlTemplate(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
