'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { settingsApi, credentialsApi } from '@/lib/api';
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
  Plus,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Copy,
  Check,
  Webhook,
  X,
  TestTube,
  RefreshCw,
} from 'lucide-react';

type SettingCategory = 'EMAIL' | 'WHATSAPP' | 'OPENAI' | 'FACEBOOK';

interface EmailCredential {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName?: string;
  isDefault: boolean;
  isActive: boolean;
  passConfigured: boolean;
}

interface WhatsAppCredential {
  id: string;
  name: string;
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  webhookUrl: string;
  isDefault: boolean;
  isActive: boolean;
  accessTokenConfigured: boolean;
  appSecretConfigured: boolean;
}

const categoryIcons: Record<SettingCategory, any> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  OPENAI: Brain,
  FACEBOOK: Facebook,
};

const categoryLabels: Record<SettingCategory, string> = {
  EMAIL: 'Email Accounts',
  WHATSAPP: 'WhatsApp Numbers',
  OPENAI: 'OpenAI',
  FACEBOOK: 'Facebook',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingCategory>('EMAIL');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailCredential | null>(null);
  const [editingWhatsApp, setEditingWhatsApp] = useState<WhatsAppCredential | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [openAISettings, setOpenAISettings] = useState({ api_key: '', model: 'gpt-4' });
  const [facebookSettings, setFacebookSettings] = useState({ app_id: '', app_secret: '' });

  const queryClient = useQueryClient();

  // Fetch email credentials
  const { data: emailCredentials = [], isLoading: loadingEmails } = useQuery({
    queryKey: ['email-credentials'],
    queryFn: () => credentialsApi.getEmailCredentials().then(res => res.data),
    enabled: activeTab === 'EMAIL',
  });

  // Fetch WhatsApp credentials
  const { data: whatsappCredentials = [], isLoading: loadingWhatsApp } = useQuery({
    queryKey: ['whatsapp-credentials'],
    queryFn: () => credentialsApi.getWhatsAppCredentials().then(res => res.data),
    enabled: activeTab === 'WHATSAPP',
  });

  // Fetch legacy settings for OpenAI and Facebook
  const { data: allSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll().then(res => res.data),
    enabled: activeTab === 'OPENAI' || activeTab === 'FACEBOOK',
  });

  useEffect(() => {
    if (allSettings) {
      if (allSettings.OPENAI) {
        setOpenAISettings({
          api_key: allSettings.OPENAI.api_key?.value || '',
          model: allSettings.OPENAI.model?.value || 'gpt-4',
        });
      }
      if (allSettings.FACEBOOK) {
        setFacebookSettings({
          app_id: allSettings.FACEBOOK.app_id?.value || '',
          app_secret: allSettings.FACEBOOK.app_secret?.value || '',
        });
      }
    }
  }, [allSettings]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email credential?')) return;

    try {
      await credentialsApi.deleteEmailCredential(id);
      queryClient.invalidateQueries({ queryKey: ['email-credentials'] });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete email credential');
    }
  };

  const handleDeleteWhatsApp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this WhatsApp credential?')) return;

    try {
      await credentialsApi.deleteWhatsAppCredential(id);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-credentials'] });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete WhatsApp credential');
    }
  };

  const handleSetDefaultEmail = async (id: string) => {
    try {
      await credentialsApi.setDefaultEmailCredential(id);
      queryClient.invalidateQueries({ queryKey: ['email-credentials'] });
    } catch (error) {
      alert('Failed to set default email');
    }
  };

  const handleSetDefaultWhatsApp = async (id: string) => {
    try {
      await credentialsApi.setDefaultWhatsAppCredential(id);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-credentials'] });
    } catch (error) {
      alert('Failed to set default WhatsApp');
    }
  };

  const handleRegenerateWebhook = async (id: string, name: string) => {
    if (!confirm(`Regenerate webhook credentials for "${name}"?\n\nThis will invalidate the current webhook URL and verify token. You'll need to update Meta Business Suite with the new values.`)) {
      return;
    }

    try {
      await credentialsApi.regenerateWhatsAppWebhook(id);
      queryClient.invalidateQueries({ queryKey: ['whatsapp-credentials'] });
      alert('✅ Webhook credentials regenerated successfully!');
    } catch (error) {
      alert('❌ Failed to regenerate webhook credentials');
    }
  };

  const handleTestEmail = async (id: string) => {
    try {
      const response = await credentialsApi.testEmailCredential(id);
      if (response.data.success) {
        alert('✅ Email connection successful!');
      } else {
        alert(`❌ Email connection failed: ${response.data.message}`);
      }
    } catch (error) {
      alert('❌ Failed to test email connection');
    }
  };

  const updateLegacySettingsMutation = useMutation({
    mutationFn: (data: any) => settingsApi.updateMultiple(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleSaveLegacySettings = async () => {
    const settings = activeTab === 'OPENAI'
      ? [
          { category: 'OPENAI', key: 'api_key', value: openAISettings.api_key, isEncrypted: true },
          { category: 'OPENAI', key: 'model', value: openAISettings.model, isEncrypted: false },
        ]
      : [
          { category: 'FACEBOOK', key: 'app_id', value: facebookSettings.app_id, isEncrypted: false },
          { category: 'FACEBOOK', key: 'app_secret', value: facebookSettings.app_secret, isEncrypted: true },
        ];

    await updateLegacySettingsMutation.mutateAsync(settings);
  };

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
            <h3 className="font-semibold text-blue-900">Multi-Credentials Support</h3>
            <p className="text-sm text-blue-700 mt-1">
              You can now configure multiple email accounts and WhatsApp numbers. All credentials are encrypted using AES-256-GCM encryption.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {(Object.keys(categoryIcons) as SettingCategory[]).map((category) => {
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
            {/* EMAIL TAB */}
            {activeTab === 'EMAIL' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Email Accounts</h2>
                  <button
                    onClick={() => {
                      setEditingEmail(null);
                      setShowEmailModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Email Account
                  </button>
                </div>

                {loadingEmails ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading email accounts...</p>
                  </div>
                ) : emailCredentials.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No email accounts configured</p>
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first email account
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {emailCredentials.map((credential: EmailCredential) => (
                      <div
                        key={credential.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="w-5 h-5 text-gray-600" />
                              <h3 className="font-semibold text-lg">{credential.name}</h3>
                              {credential.isDefault && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  DEFAULT
                                </span>
                              )}
                              {credential.isActive ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700">{credential.fromEmail}</p>
                            <p className="text-gray-500 text-sm">{credential.host}:{credential.port}</p>
                          </div>
                          <div className="flex gap-2">
                            {!credential.isDefault && (
                              <button
                                onClick={() => handleSetDefaultEmail(credential.id)}
                                className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                title="Set as default"
                              >
                                <StarOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleTestEmail(credential.id)}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Test connection"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingEmail(credential);
                                setShowEmailModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmail(credential.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WHATSAPP TAB */}
            {activeTab === 'WHATSAPP' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">WhatsApp Numbers</h2>
                  <button
                    onClick={() => {
                      setEditingWhatsApp(null);
                      setShowWhatsAppModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add WhatsApp Number
                  </button>
                </div>

                {loadingWhatsApp ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading WhatsApp numbers...</p>
                  </div>
                ) : whatsappCredentials.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No WhatsApp numbers configured</p>
                    <button
                      onClick={() => setShowWhatsAppModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first WhatsApp number
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {whatsappCredentials.map((credential: WhatsAppCredential) => (
                      <div
                        key={credential.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-5 h-5 text-gray-600" />
                              <h3 className="font-semibold text-lg">{credential.name}</h3>
                              {credential.isDefault && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  DEFAULT
                                </span>
                              )}
                              {credential.isActive ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700">{credential.phoneNumber}</p>
                            <p className="text-gray-500 text-sm">Phone Number ID: {credential.phoneNumberId}</p>
                          </div>
                          <div className="flex gap-2">
                            {!credential.isDefault && (
                              <button
                                onClick={() => handleSetDefaultWhatsApp(credential.id)}
                                className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                title="Set as default"
                              >
                                <StarOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingWhatsApp(credential);
                                setShowWhatsAppModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteWhatsApp(credential.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Webhook Info Section - ALWAYS VISIBLE */}
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Webhook className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-gray-900">Webhook Credentials for Facebook</h4>
                            <button
                              onClick={() => handleRegenerateWebhook(credential.id, credential.name)}
                              className="ml-auto px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                              title="Regenerate webhook credentials"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Regenerate
                            </button>
                          </div>

                          {/* Webhook URL - Always Visible */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              📋 Callback URL (Copy this to Facebook Developer Platform)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={credential.webhookUrl || 'Generating...'}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => copyToClipboard(credential.webhookUrl)}
                                disabled={!credential.webhookUrl}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {copiedText === credential.webhookUrl ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Verify Token - Always Visible */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              🔑 Verify Token (Copy this to Facebook Developer Platform)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={credential.webhookVerifyToken || 'Generating...'}
                                readOnly
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => copyToClipboard(credential.webhookVerifyToken)}
                                disabled={!credential.webhookVerifyToken}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 whitespace-nowrap text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {copiedText === credential.webhookVerifyToken ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Help Text */}
                          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mt-3">
                            <p className="text-xs text-blue-900 font-medium mb-1">📝 Setup Instructions:</p>
                            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                              <li>Copy the Callback URL and Verify Token above</li>
                              <li>Go to <strong>Meta Business Suite → Your App → WhatsApp → Configuration</strong></li>
                              <li>Click <strong>&quot;Edit&quot;</strong> in the Webhook section</li>
                              <li>Paste the Callback URL and Verify Token</li>
                              <li>Subscribe to webhook fields: <strong>messages, messaging_postbacks</strong></li>
                              <li>Click <strong>&quot;Verify and Save&quot;</strong></li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OPENAI TAB */}
            {activeTab === 'OPENAI' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold mb-6">OpenAI Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenAI API Key
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        Encrypted
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords['openai_key'] ? 'text' : 'password'}
                        value={openAISettings.api_key}
                        onChange={(e) => setOpenAISettings({ ...openAISettings, api_key: e.target.value })}
                        placeholder="sk-..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, openai_key: !showPasswords['openai_key'] })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords['openai_key'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      value={openAISettings.model}
                      onChange={(e) => setOpenAISettings({ ...openAISettings, model: e.target.value })}
                      placeholder="gpt-4"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">e.g., gpt-4, gpt-3.5-turbo</p>
                  </div>
                  <button
                    onClick={handleSaveLegacySettings}
                    disabled={updateLegacySettingsMutation.isPending}
                    className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateLegacySettingsMutation.isPending ? 'Saving...' : 'Save OpenAI Settings'}
                  </button>
                  {updateLegacySettingsMutation.isSuccess && (
                    <div className="flex items-center text-green-600 mt-2">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Settings saved successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FACEBOOK TAB */}
            {activeTab === 'FACEBOOK' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold mb-6">Facebook Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                    <input
                      type="text"
                      value={facebookSettings.app_id}
                      onChange={(e) => setFacebookSettings({ ...facebookSettings, app_id: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App Secret
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        Encrypted
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords['facebook_secret'] ? 'text' : 'password'}
                        value={facebookSettings.app_secret}
                        onChange={(e) => setFacebookSettings({ ...facebookSettings, app_secret: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, facebook_secret: !showPasswords['facebook_secret'] })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords['facebook_secret'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveLegacySettings}
                    disabled={updateLegacySettingsMutation.isPending}
                    className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateLegacySettingsMutation.isPending ? 'Saving...' : 'Save Facebook Settings'}
                  </button>
                  {updateLegacySettingsMutation.isSuccess && (
                    <div className="flex items-center text-green-600 mt-2">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Settings saved successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailCredentialModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEditingEmail(null);
        }}
        credential={editingEmail}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['email-credentials'] });
          setShowEmailModal(false);
          setEditingEmail(null);
        }}
      />

      {/* WhatsApp Modal */}
      <WhatsAppCredentialModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false);
          setEditingWhatsApp(null);
        }}
        credential={editingWhatsApp}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-credentials'] });
          setShowWhatsAppModal(false);
          setEditingWhatsApp(null);
        }}
      />
    </DashboardLayout>
  );
}

// Email Credential Modal Component
function EmailCredentialModal({
  isOpen,
  onClose,
  credential,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  credential: EmailCredential | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 587,
    secure: true,
    user: '',
    pass: '',
    fromEmail: '',
    fromName: '',
    isDefault: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (credential) {
      setFormData({
        name: credential.name,
        host: credential.host,
        port: credential.port,
        secure: credential.secure,
        user: credential.user,
        pass: '',
        fromEmail: credential.fromEmail,
        fromName: credential.fromName || '',
        isDefault: credential.isDefault,
      });
    } else {
      setFormData({
        name: '',
        host: '',
        port: 587,
        secure: true,
        user: '',
        pass: '',
        fromEmail: '',
        fromName: '',
        isDefault: false,
      });
    }
  }, [credential, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { ...formData };
      // Don't send empty password on edit
      if (credential && !payload.pass) {
        delete (payload as any).pass;
      }

      if (credential) {
        await credentialsApi.updateEmailCredential(credential.id, payload);
      } else {
        await credentialsApi.createEmailCredential(payload);
      }
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save email credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{credential ? 'Edit' : 'Add'} Email Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Support Email, Sales Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host *</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.secure}
                onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Use SSL/TLS (recommended for port 465)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username *</label>
            <input
              type="text"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              placeholder="your-email@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMTP Password {credential ? '(leave empty to keep current)' : '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.pass}
                onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                placeholder="Your SMTP password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required={!credential}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Email *</label>
            <input
              type="email"
              value={formData.fromEmail}
              onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
              placeholder="noreply@yourcompany.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Name (optional)</label>
            <input
              type="text"
              value={formData.fromName}
              onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
              placeholder="Your Company"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Set as default email account</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : credential ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// WhatsApp Credential Modal Component
function WhatsAppCredentialModal({
  isOpen,
  onClose,
  credential,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  credential: WhatsAppCredential | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    appSecret: '',
    isDefault: false,
  });
  const [showTokens, setShowTokens] = useState({ accessToken: false, appSecret: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (credential) {
      setFormData({
        name: credential.name,
        phoneNumber: credential.phoneNumber,
        phoneNumberId: credential.phoneNumberId,
        businessAccountId: credential.businessAccountId,
        accessToken: '',
        appSecret: '',
        isDefault: credential.isDefault,
      });
    } else {
      setFormData({
        name: '',
        phoneNumber: '',
        phoneNumberId: '',
        businessAccountId: '',
        accessToken: '',
        appSecret: '',
        isDefault: false,
      });
    }
  }, [credential, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { ...formData };
      // Don't send empty tokens on edit
      if (credential) {
        if (!payload.accessToken) delete (payload as any).accessToken;
        if (!payload.appSecret) delete (payload as any).appSecret;
      }

      if (credential) {
        await credentialsApi.updateWhatsAppCredential(credential.id, payload);
      } else {
        await credentialsApi.createWhatsAppCredential(payload);
      }
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save WhatsApp credential');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{credential ? 'Edit' : 'Add'} WhatsApp Number</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Support Line, Sales Line"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID *</label>
            <input
              type="text"
              value={formData.phoneNumberId}
              onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
              placeholder="123456789012345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Account ID *</label>
            <input
              type="text"
              value={formData.businessAccountId}
              onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
              placeholder="987654321098765"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token {credential ? '(leave empty to keep current)' : '*'}
            </label>
            <div className="relative">
              <input
                type={showTokens.accessToken ? 'text' : 'password'}
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="EAABcdEFGhijklmno..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required={!credential}
              />
              <button
                type="button"
                onClick={() => setShowTokens({ ...showTokens, accessToken: !showTokens.accessToken })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showTokens.accessToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App Secret (optional)
            </label>
            <div className="relative">
              <input
                type={showTokens.appSecret ? 'text' : 'password'}
                value={formData.appSecret}
                onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                placeholder="abc123secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowTokens({ ...showTokens, appSecret: !showTokens.appSecret })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showTokens.appSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Set as default WhatsApp number</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : credential ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}