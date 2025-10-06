'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { settingsApi } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Mail,
  MessageSquare,
  Brain,
  Facebook,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

type SettingCategory = 'SMTP' | 'WHATSAPP' | 'OPENAI' | 'FACEBOOK';

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number';
  isEncrypted: boolean;
  description?: string;
  placeholder?: string;
}

interface SettingsFormData {
  [category: string]: {
    [key: string]: string;
  };
}

const settingFields: Record<SettingCategory, SettingField[]> = {
  SMTP: [
    { key: 'host', label: 'SMTP Host', type: 'text', isEncrypted: false, placeholder: 'smtp.gmail.com' },
    { key: 'port', label: 'SMTP Port', type: 'number', isEncrypted: false, placeholder: '465' },
    { key: 'secure', label: 'Use SSL/TLS', type: 'text', isEncrypted: false, placeholder: 'true', description: 'Set to "true" for port 465, "false" for other ports' },
    { key: 'user', label: 'SMTP Username', type: 'text', isEncrypted: false, placeholder: 'your-email@gmail.com' },
    { key: 'pass', label: 'SMTP Password', type: 'password', isEncrypted: true, placeholder: 'Your app password' },
    { key: 'from', label: 'From Email', type: 'text', isEncrypted: false, placeholder: 'noreply@yourcompany.com' },
  ],
  WHATSAPP: [
    { key: 'business_account_id', label: 'Business Account ID', type: 'text', isEncrypted: false },
    { key: 'access_token', label: 'Access Token', type: 'password', isEncrypted: true },
    { key: 'app_secret', label: 'App Secret', type: 'password', isEncrypted: true },
    { key: 'verify_token', label: 'Verify Token', type: 'text', isEncrypted: false },
    { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', isEncrypted: false },
  ],
  OPENAI: [
    { key: 'api_key', label: 'OpenAI API Key', type: 'password', isEncrypted: true, placeholder: 'sk-...' },
    { key: 'model', label: 'Model', type: 'text', isEncrypted: false, placeholder: 'gpt-4', description: 'e.g., gpt-4, gpt-3.5-turbo' },
  ],
  FACEBOOK: [
    { key: 'app_id', label: 'App ID', type: 'text', isEncrypted: false },
    { key: 'app_secret', label: 'App Secret', type: 'password', isEncrypted: true },
  ],
};

const categoryIcons: Record<SettingCategory, typeof Settings> = {
  SMTP: Mail,
  WHATSAPP: MessageSquare,
  OPENAI: Brain,
  FACEBOOK: Facebook,
};

const categoryLabels: Record<SettingCategory, string> = {
  SMTP: 'Email (SMTP)',
  WHATSAPP: 'WhatsApp',
  OPENAI: 'OpenAI',
  FACEBOOK: 'Facebook',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingCategory>('SMTP');
  const [formData, setFormData] = useState<SettingsFormData>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: allSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll().then(res => res.data),
  });

  useEffect(() => {
    if (allSettings) {
      const initialData: SettingsFormData = {};
      Object.entries(allSettings).forEach(([category, settings]: [string, any]) => {
        initialData[category] = {};
        Object.entries(settings).forEach(([key, setting]: [string, any]) => {
          initialData[category][key] = setting.value || '';
        });
      });
      setFormData(initialData);
    }
  }, [allSettings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsApi.updateMultiple(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleInputChange = (category: string, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSaveCategory = async () => {
    const categoryData = formData[activeTab] || {};
    const fields = settingFields[activeTab];

    const settings = fields.map(field => ({
      category: activeTab,
      key: field.key,
      value: categoryData[field.key] || '',
      isEncrypted: field.isEncrypted,
      description: field.description,
    }));

    await updateMutation.mutateAsync(settings);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your application integrations and credentials</p>
        </div>

        {/* Alert Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">Secure Configuration</h3>
            <p className="text-sm text-blue-700 mt-1">
              All sensitive credentials (passwords, API keys, tokens) are encrypted using AES-256-GCM encryption before being stored in the database.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {(Object.keys(settingFields) as SettingCategory[]).map((category) => {
                const Icon = categoryIcons[category];
                const isActive = activeTab === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {categoryLabels[category]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            <div className="max-w-3xl">
              <div className="space-y-6">
                {settingFields[activeTab].map((field) => {
                  const value = formData[activeTab]?.[field.key] || '';
                  const fieldKey = `${activeTab}_${field.key}`;
                  const showPassword = showPasswords[fieldKey];

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.isEncrypted && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Encrypted
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={field.type === 'password' && !showPassword ? 'password' : field.type}
                          value={value}
                          onChange={(e) => handleInputChange(activeTab, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(fieldKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        )}
                      </div>
                      {field.description && (
                        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={handleSaveCategory}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : `Save ${categoryLabels[activeTab]} Settings`}
                </button>

                {updateMutation.isSuccess && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">Settings saved successfully!</span>
                  </div>
                )}

                {updateMutation.isError && (
                  <div className="flex items-center text-red-600">
                    <XCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm font-medium">Failed to save settings</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Configuration Help</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {activeTab === 'SMTP' && (
              <>
                <p>• <strong>Gmail:</strong> Use smtp.gmail.com (port 465) and create an app-specific password in your Google Account settings</p>
                <p>• <strong>Outlook:</strong> Use smtp-mail.outlook.com (port 587) with your Microsoft account credentials</p>
                <p>• <strong>Custom SMTP:</strong> Contact your email provider for the correct SMTP settings</p>
              </>
            )}
            {activeTab === 'WHATSAPP' && (
              <>
                <p>• Get your credentials from the <strong>Meta for Developers</strong> dashboard</p>
                <p>• Create a WhatsApp Business App and add the WhatsApp product</p>
                <p>• The Business Account ID and Phone Number ID can be found in your app settings</p>
              </>
            )}
            {activeTab === 'OPENAI' && (
              <>
                <p>• Get your API key from <strong>platform.openai.com</strong></p>
                <p>• Recommended models: gpt-4 for best quality, gpt-3.5-turbo for faster responses</p>
                <p>• Make sure your OpenAI account has sufficient credits</p>
              </>
            )}
            {activeTab === 'FACEBOOK' && (
              <>
                <p>• Create a Facebook App in the <strong>Meta for Developers</strong> dashboard</p>
                <p>• Your App ID and App Secret can be found in the app settings</p>
                <p>• Required for WhatsApp Business API integration</p>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
