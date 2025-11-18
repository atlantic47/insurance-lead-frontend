'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api';
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Plus,
  Trash2,
  Phone,
  ExternalLink,
  MessageCircle,
  Info,
} from 'lucide-react';

interface WhatsAppTemplateModalProps {
  template?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing', description: 'Promotional offers, newsletters' },
  { value: 'UTILITY', label: 'Utility', description: 'Account updates, order updates' },
  { value: 'AUTHENTICATION', label: 'Authentication', description: 'OTP codes, verification' },
];

const HEADER_FORMATS = [
  { value: 'NONE', label: 'No Header', icon: null },
  { value: 'TEXT', label: 'Text', icon: FileText },
  { value: 'IMAGE', label: 'Image', icon: ImageIcon },
  { value: 'VIDEO', label: 'Video', icon: Video },
  { value: 'DOCUMENT', label: 'Document', icon: FileText },
];

const BUTTON_TYPES = [
  { value: 'QUICK_REPLY', label: 'Quick Reply', icon: MessageCircle },
  { value: 'PHONE_NUMBER', label: 'Call', icon: Phone },
  { value: 'URL', label: 'Website', icon: ExternalLink },
];

export default function WhatsAppTemplateModal({
  template,
  onClose,
  onSuccess,
}: WhatsAppTemplateModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    category: template?.category || 'MARKETING',
    language: template?.language || 'en',
    headerFormat: template?.headerFormat || 'NONE',
    headerText: template?.headerText || '',
    headerMediaUrl: '',
    body: template?.body || '',
    footer: template?.footer || '',
    buttons: template?.buttons ? JSON.parse(template.buttons) : [],
    bodyExamples: [] as string[],
    headerExamples: [] as string[],
  });

  // Update examples when body or header text changes
  useEffect(() => {
    const bodyVarCount = countVariables(formData.body);
    const headerVarCount = formData.headerFormat === 'TEXT' ? countVariables(formData.headerText) : 0;

    // Resize body examples array to match variable count
    if (formData.bodyExamples.length !== bodyVarCount) {
      const newExamples = Array.from({ length: bodyVarCount }, (_, i) =>
        formData.bodyExamples[i] || ''
      );
      setFormData(prev => ({ ...prev, bodyExamples: newExamples }));
    }

    // Resize header examples array to match variable count
    if (formData.headerExamples.length !== headerVarCount) {
      const newExamples = Array.from({ length: headerVarCount }, (_, i) =>
        formData.headerExamples[i] || ''
      );
      setFormData(prev => ({ ...prev, headerExamples: newExamples }));
    }
  }, [formData.body, formData.headerText, formData.headerFormat]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bodyTextareaRef, setBodyTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [headerTextareaRef, setHeaderTextareaRef] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: any) => whatsappApi.createTemplate(data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Failed to create template';
      alert(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => whatsappApi.updateTemplate(id, data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || 'Failed to update template';
      alert(errorMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate template name
    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      setErrors({ name: 'Template name must be lowercase alphanumeric with underscores only' });
      return;
    }

    // Validate media URL for media headers
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerFormat) && !formData.headerMediaUrl) {
      alert(`Please provide an example ${formData.headerFormat.toLowerCase()} URL for the header`);
      return;
    }

    // Validate body variable examples
    const bodyVariableCount = countVariables(formData.body);
    if (bodyVariableCount > 0) {
      const emptyBodyExamples = formData.bodyExamples.filter(ex => !ex.trim());
      if (emptyBodyExamples.length > 0) {
        alert('Please provide example values for all body variables');
        return;
      }
    }

    // Validate header variable examples (if TEXT header)
    const headerVariableCount = formData.headerFormat === 'TEXT' ? countVariables(formData.headerText) : 0;
    if (headerVariableCount > 0) {
      const emptyHeaderExamples = formData.headerExamples.filter(ex => !ex.trim());
      if (emptyHeaderExamples.length > 0) {
        alert('Please provide example values for all header variables');
        return;
      }
    }

    // Use manually entered examples
    const bodyExamples = formData.bodyExamples;
    const headerExamples = formData.headerExamples;

    // Build header object based on format
    let header = undefined;
    if (formData.headerFormat !== 'NONE') {
      if (formData.headerFormat === 'TEXT') {
        header = {
          format: formData.headerFormat,
          text: formData.headerText,
        };
      } else {
        // IMAGE, VIDEO, or DOCUMENT
        header = {
          format: formData.headerFormat,
          example: formData.headerMediaUrl,
        };
      }
    }

    const submitData = {
      name: formData.name,
      category: formData.category,
      language: formData.language,
      header,
      body: formData.body,
      footer: formData.footer || undefined,
      buttons: formData.buttons.length > 0 ? formData.buttons : undefined,
      bodyExamples: bodyVariableCount > 0 ? bodyExamples : undefined,
      headerExamples: headerVariableCount > 0 ? headerExamples : undefined,
      submitToMeta: false, // Don't auto-submit, user must manually submit
    };

    if (template) {
      updateMutation.mutate({ id: template.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addButton = (type: string) => {
    if (formData.buttons.length >= 10) {
      alert('Maximum 10 buttons allowed');
      return;
    }

    const newButton: any = { type, text: '' };
    if (type === 'PHONE_NUMBER') newButton.phoneNumber = '';
    if (type === 'URL') newButton.url = '';

    setFormData({ ...formData, buttons: [...formData.buttons, newButton] });
  };

  const removeButton = (index: number) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index),
    });
  };

  const updateButton = (index: number, field: string, value: string) => {
    const updatedButtons = [...formData.buttons];
    updatedButtons[index] = { ...updatedButtons[index], [field]: value };
    setFormData({ ...formData, buttons: updatedButtons });
  };

  // Count variables in text
  const countVariables = (text: string) => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.length : 0;
  };

  // Replace variables with example values for preview
  const replaceVariablesWithExamples = (text: string, examples: string[]) => {
    if (!text) return text;
    return text.replace(/\{\{(\d+)\}\}/g, (match, num) => {
      const index = parseInt(num) - 1;
      return examples[index] || match;
    });
  };

  // Insert variable at cursor position
  const insertVariable = (field: 'body' | 'headerText') => {
    const textarea = field === 'body' ? bodyTextareaRef : headerTextareaRef;
    if (!textarea) return;

    const currentVariables = countVariables(formData[field]);
    const nextVariableNumber = currentVariables + 1;
    const variableText = `{{${nextVariableNumber}}}`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData[field];
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + variableText + after;
    setFormData({ ...formData, [field]: newText });

    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Templates must be approved by Meta before use
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Split Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Side - Form */}
          <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="welcome_message"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Category & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {CATEGORIES.find((c) => c.value === formData.category)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language *
                  </label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="en"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">e.g., en, en_US, es</p>
                </div>
              </div>

              {/* Header */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header (Optional)
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {HEADER_FORMATS.map((format) => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, headerFormat: format.value, headerText: '' })
                      }
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                        formData.headerFormat === format.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {format.icon && <format.icon className="w-5 h-5 mb-1" />}
                      <span className="text-xs font-medium">{format.label}</span>
                    </button>
                  ))}
                </div>

                {formData.headerFormat === 'TEXT' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        ref={setHeaderTextareaRef}
                        type="text"
                        value={formData.headerText}
                        onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                        className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Header text (max 60 characters)"
                        maxLength={60}
                      />
                      <button
                        type="button"
                        onClick={() => insertVariable('headerText')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium"
                      >
                        + Variable
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formData.headerText.length}/60 characters • {countVariables(formData.headerText)} variable{countVariables(formData.headerText) !== 1 ? 's' : ''}
                    </p>

                    {/* Header Variable Examples */}
                    {formData.headerExamples.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-medium text-yellow-900 mb-2">
                          Header Variable Examples
                        </p>
                        <div className="space-y-2">
                          {formData.headerExamples.map((example, index) => (
                            <div key={index}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Example for {'{{' + (index + 1) + '}}'}
                                <span className="text-red-500 ml-1">*</span>
                              </label>
                              <input
                                type="text"
                                value={example}
                                onChange={(e) => {
                                  const newExamples = [...formData.headerExamples];
                                  newExamples[index] = e.target.value;
                                  setFormData({ ...formData, headerExamples: newExamples });
                                }}
                                className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                                placeholder={`e.g., ${index === 0 ? 'Premium Offer' : 'Example value'}`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(formData.headerFormat === 'IMAGE' ||
                  formData.headerFormat === 'VIDEO' ||
                  formData.headerFormat === 'DOCUMENT') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Example Media URL *
                      </label>
                      <input
                        type="url"
                        value={formData.headerMediaUrl}
                        onChange={(e) => setFormData({ ...formData, headerMediaUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        placeholder={`https://example.com/${formData.headerFormat === 'IMAGE' ? 'image.jpg' : formData.headerFormat === 'VIDEO' ? 'video.mp4' : 'document.pdf'}`}
                        required
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800 font-medium mb-1">
                        📌 Important: Media Requirements
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {formData.headerFormat === 'IMAGE' && (
                          <>
                            <li>• Format: JPG or PNG</li>
                            <li>• Size: Max 5MB</li>
                            <li>• Aspect ratio: 1:1 or 16:9 recommended</li>
                          </>
                        )}
                        {formData.headerFormat === 'VIDEO' && (
                          <>
                            <li>• Format: MP4 or 3GP</li>
                            <li>• Size: Max 16MB</li>
                            <li>• Duration: Max 60 seconds recommended</li>
                          </>
                        )}
                        {formData.headerFormat === 'DOCUMENT' && (
                          <>
                            <li>• Format: PDF</li>
                            <li>• Size: Max 100MB</li>
                            <li>• File name will be displayed to users</li>
                          </>
                        )}
                        <li>• URL must be publicly accessible (https://)</li>
                        <li>• This is just an example - actual media provided when sending</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Message Body *
                  </label>
                  <button
                    type="button"
                    onClick={() => insertVariable('body')}
                    className="inline-flex items-center px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Variable
                  </button>
                </div>
                <textarea
                  ref={setBodyTextareaRef}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  rows={6}
                  placeholder="Hi {{1}}, thank you for your interest! Click 'Add Variable' to insert placeholders."
                  maxLength={1024}
                  required
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {formData.body.length}/1024 characters • {countVariables(formData.body)} variable
                    {countVariables(formData.body) !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      <Info className="w-3 h-3 mr-1" />
                      Variables: {'{{1}}'}, {'{{2}}'}, etc.
                    </span>
                  </div>
                </div>

                {/* Body Variable Examples */}
                {formData.bodyExamples.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Info className="w-4 h-4 text-yellow-700 mr-2" />
                      <p className="text-sm font-medium text-yellow-900">
                        Variable Examples (Required for Meta Approval)
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700 mb-3">
                      Provide example values for each variable. These help Meta understand your template usage.
                    </p>
                    <div className="space-y-2">
                      {formData.bodyExamples.map((example, index) => (
                        <div key={index}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Example for {'{{' + (index + 1) + '}}'}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            value={example}
                            onChange={(e) => {
                              const newExamples = [...formData.bodyExamples];
                              newExamples[index] = e.target.value;
                              setFormData({ ...formData, bodyExamples: newExamples });
                            }}
                            className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                            placeholder={`e.g., ${index === 0 ? 'John Doe' : index === 1 ? 'Policy #12345' : index === 2 ? 'March 15, 2024' : 'Example value'}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer (Optional)
                </label>
                <input
                  type="text"
                  value={formData.footer}
                  onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Footer text (max 60 characters)"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.footer.length}/60 characters</p>
              </div>

              {/* Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buttons (Optional)
                </label>

                {formData.buttons.length > 0 && (
                  <div className="space-y-3 mb-3">
                    {formData.buttons.map((button, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {BUTTON_TYPES.find((t) => t.value === button.type)?.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeButton(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={button.text}
                          onChange={(e) => updateButton(index, 'text', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                          placeholder="Button text (max 25 characters)"
                          maxLength={25}
                        />

                        {button.type === 'PHONE_NUMBER' && (
                          <input
                            type="tel"
                            value={button.phoneNumber}
                            onChange={(e) => updateButton(index, 'phoneNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="+1234567890"
                          />
                        )}

                        {button.type === 'URL' && (
                          <input
                            type="url"
                            value={button.url}
                            onChange={(e) => updateButton(index, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="https://example.com"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {BUTTON_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => addButton(type.value)}
                      disabled={formData.buttons.length >= 10}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <type.icon className="w-4 h-4 mr-1.5" />
                      {type.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Max 10 Quick Reply or 2 Call-to-Action buttons
                </p>
              </div>

              {/* Variable Guide */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Using Variables</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• Click <strong>"Add Variable"</strong> to insert {'{{1}}'}, {'{{2}}'}, etc.</li>
                      <li>• Variables auto-number based on order (first variable is {'{{1}}'}, second is {'{{2}}'})</li>
                      <li>• Use variables for: customer names, dates, order numbers, amounts</li>
                      <li>• Example: "Hi {'{{1}}'}, your order {'{{2}}'} will arrive on {'{{3}}'}"</li>
                      <li>• <strong className="text-yellow-700">⚠ You must provide example values</strong> for each variable (required by Meta)</li>
                      <li>• Example values help Meta understand your template; actual values provided when sending</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : template
                    ? 'Update Template'
                    : 'Create Template'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side - Live Preview */}
          <div className="w-1/2 bg-gradient-to-br from-gray-100 to-gray-200 p-6 overflow-y-auto">
            <div className="sticky top-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                Live WhatsApp Preview
              </h3>

              {/* Phone Mockup */}
              <div className="mx-auto max-w-sm">
                <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
                  {/* Phone Screen */}
                  <div className="bg-white rounded-[2.5rem] overflow-hidden">
                    {/* Status Bar */}
                    <div className="bg-[#075E54] px-6 pt-3 pb-1">
                      <div className="flex items-center justify-between text-white text-xs">
                        <span>9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-3 border border-white rounded-sm"></div>
                          <div className="w-3 h-3 border border-white rounded-full"></div>
                          <div className="flex gap-[2px]">
                            <div className="w-[2px] h-3 bg-white"></div>
                            <div className="w-[2px] h-3 bg-white opacity-70"></div>
                            <div className="w-[2px] h-3 bg-white opacity-40"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Header */}
                    <div className="bg-[#075E54] text-white px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <button className="mr-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                          </svg>
                        </button>
                        <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <MessageCircle className="w-5 h-5 text-[#075E54]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Customer Name</p>
                          <p className="text-xs text-gray-200">WhatsApp Business</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Chat Area with WhatsApp pattern background */}
                    <div
                      className="h-[500px] p-4 overflow-y-auto"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d9d9d9' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundColor: '#E5DDD5'
                      }}
                    >
                      {/* Date Badge */}
                      <div className="flex justify-center mb-4">
                        <div className="bg-white bg-opacity-90 px-3 py-1 rounded-md shadow-sm">
                          <span className="text-xs text-gray-600">TODAY</span>
                        </div>
                      </div>

                      {/* Message Bubble (Right side - sent by business) */}
                      <div className="flex justify-end mb-2">
                        <div className="relative max-w-[80%]" style={{ backgroundColor: '#DCF8C6', borderRadius: '8px', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}>
                          {/* Header Media */}
                          {formData.headerFormat !== 'NONE' && formData.headerFormat && (
                            <div>
                              {formData.headerFormat === 'TEXT' && formData.headerText && (
                                <div className="px-2 pt-2">
                                  <p className="font-bold text-gray-900 text-[15px] leading-tight mb-1">
                                    {replaceVariablesWithExamples(formData.headerText, formData.headerExamples)}
                                  </p>
                                </div>
                              )}
                              {formData.headerFormat === 'IMAGE' && (
                                <div className="w-full" style={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px', overflow: 'hidden' }}>
                                  {formData.headerMediaUrl ? (
                                    <img
                                      src={formData.headerMediaUrl}
                                      alt="Header"
                                      className="w-full h-40 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-40 bg-gray-300 flex items-center justify-center">
                                      <ImageIcon className="w-10 h-10 text-gray-500" />
                                    </div>
                                  )}
                                </div>
                              )}
                              {formData.headerFormat === 'VIDEO' && (
                                <div className="w-full relative" style={{ borderTopLeftRadius: '8px', borderTopRightRadius: '8px', overflow: 'hidden' }}>
                                  <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                    </div>
                                  </div>
                                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-2 py-0.5 rounded text-white text-[11px]">
                                    0:30
                                  </div>
                                </div>
                              )}
                              {formData.headerFormat === 'DOCUMENT' && (
                                <div className="px-2 pt-2 pb-1 flex items-center bg-white bg-opacity-50 mx-2 mt-2 rounded">
                                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] text-gray-900 truncate font-medium">
                                      {formData.headerMediaUrl
                                        ? formData.headerMediaUrl.split('/').pop() || 'Document.pdf'
                                        : 'Document.pdf'}
                                    </p>
                                    <p className="text-[11px] text-gray-500">PDF • 1 page</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Body */}
                          <div className="px-2 py-1.5" style={{ paddingTop: formData.headerFormat === 'TEXT' && formData.headerText ? '4px' : formData.headerFormat !== 'NONE' && formData.headerFormat ? '8px' : '6px' }}>
                            <p className="text-[14.2px] text-gray-900 leading-[1.4] whitespace-pre-wrap break-words">
                              {formData.body ? (
                                replaceVariablesWithExamples(formData.body, formData.bodyExamples)
                              ) : (
                                <span className="text-gray-400 italic">Your message will appear here...</span>
                              )}
                            </p>
                          </div>

                          {/* Footer */}
                          {formData.footer && (
                            <div className="px-2 pb-1">
                              <p className="text-[13px] text-gray-500 leading-tight">{formData.footer}</p>
                            </div>
                          )}

                          {/* Timestamp and status */}
                          <div className="px-2 pb-1.5 flex items-center justify-end gap-1">
                            <span className="text-[11px] text-gray-500">
                              {new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 16 15">
                              <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                            </svg>
                          </div>

                          {/* Message tail (WhatsApp triangle) */}
                          <div className="absolute -right-2 bottom-0" style={{ width: 0, height: 0, borderLeft: '8px solid #DCF8C6', borderTop: '8px solid transparent', borderBottom: '8px solid transparent' }}></div>
                        </div>
                      </div>

                      {/* Buttons (Below message bubble) */}
                      {formData.buttons.length > 0 && (
                        <div className="flex justify-end mb-2">
                          <div className="max-w-[80%] space-y-1.5">
                            {formData.buttons.map((button, index) => (
                              <div
                                key={index}
                                className="bg-white px-4 py-2.5 rounded-md shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                style={{ boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' }}
                              >
                                {button.type === 'PHONE_NUMBER' && (
                                  <Phone className="w-4 h-4 text-[#00A5F4]" />
                                )}
                                {button.type === 'URL' && (
                                  <ExternalLink className="w-4 h-4 text-[#00A5F4]" />
                                )}
                                {button.type === 'QUICK_REPLY' && (
                                  <MessageCircle className="w-4 h-4 text-[#00A5F4]" />
                                )}
                                <span className="text-[14px] font-medium text-[#00A5F4]">
                                  {button.text || 'Button'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Powered by WhatsApp badge */}
                      <div className="flex justify-center mt-6">
                        <div className="bg-white bg-opacity-90 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                          <span className="text-[11px] text-gray-600 font-medium">WhatsApp Business Message</span>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Input Bar (disabled) */}
                    <div className="bg-[#F0F0F0] px-3 py-2.5 flex items-center gap-3">
                      <button className="p-2 text-gray-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"/>
                        </svg>
                      </button>
                      <div className="flex-1 bg-white rounded-full px-4 py-2">
                        <p className="text-sm text-gray-400">Type a message</p>
                      </div>
                      <button className="p-2 text-gray-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                        </svg>
                      </button>
                      <button className="p-2 text-gray-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                          <path d="M13.5 7C13.5 7.83 12.83 8.5 12 8.5S10.5 7.83 10.5 7 11.17 5.5 12 5.5s1.5.67 1.5 1.5zM12 18.5c2.49 0 4.55-1.73 5.16-4.08l-.93-.34c-.51 1.88-2.26 3.25-4.23 3.25s-3.72-1.37-4.23-3.25l-.93.34c.61 2.35 2.67 4.08 5.16 4.08z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Template Guidelines</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Templates must be approved by Meta before use</li>
                      <li>• Use {'{{1}}'}, {'{{2}}'} for dynamic variables</li>
                      <li>• Max 10 Quick Reply or 2 Call-to-Action buttons</li>
                      <li>• Follow Meta's commerce and promotional policies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
