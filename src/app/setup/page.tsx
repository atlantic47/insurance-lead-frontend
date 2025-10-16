'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { tenantsApi } from '@/lib/api';

interface WebhookUrls {
  whatsapp: {
    webhookUrl: string;
    verifyToken: string;
    configured: boolean;
  };
  facebook: {
    webhookUrl: string;
    verifyToken: string;
    configured: boolean;
  };
}

interface CredentialsForm {
  whatsapp: {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    appSecret: string;
  };
  email: {
    host: string;
    port: string;
    user: string;
    pass: string;
  };
}

export default function SetupPage() {
  const router = useRouter();
  const { user, tenant } = useAuthStore();
  const [webhookUrls, setWebhookUrls] = useState<WebhookUrls | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');

  const [credentials, setCredentials] = useState<CredentialsForm>({
    whatsapp: {
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      appSecret: '',
    },
    email: {
      host: '',
      port: '587',
      user: '',
      pass: '',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchWebhookUrls();
  }, [user]);

  const fetchWebhookUrls = async () => {
    try {
      const response = await tenantsApi.getWebhookUrls();
      setWebhookUrls(response.data);
    } catch (error) {
      console.error('Failed to fetch webhook URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: any = {};

      if (activeTab === 'whatsapp' && credentials.whatsapp.accessToken) {
        data.whatsapp = {
          accessToken: credentials.whatsapp.accessToken,
          phoneNumberId: credentials.whatsapp.phoneNumberId,
          businessAccountId: credentials.whatsapp.businessAccountId,
          appSecret: credentials.whatsapp.appSecret,
          webhookVerifyToken: webhookUrls?.whatsapp.verifyToken,
        };
      }

      if (activeTab === 'email' && credentials.email.host) {
        data.email = {
          host: credentials.email.host,
          port: parseInt(credentials.email.port),
          user: credentials.email.user,
          pass: credentials.email.pass,
          secure: true,
        };
      }

      await tenantsApi.setupCredentials(data);
      alert('Credentials saved successfully!');

      // Refresh webhook URLs to update configured status
      await fetchWebhookUrls();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    try {
      await tenantsApi.completeOnboarding();
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold">Welcome to {tenant?.name || 'Your CRM'}!</h1>
            <p className="mt-2 text-blue-100">
              Let's set up your integrations to start receiving leads
            </p>
          </div>

          {/* Progress */}
          <div className="px-8 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {webhookUrls?.whatsapp.configured ? (
                  <CheckCircle2 className="text-green-600" size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={webhookUrls?.whatsapp.configured ? 'text-green-600 font-medium' : ''}>
                  WhatsApp
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {webhookUrls?.facebook.configured ? (
                  <CheckCircle2 className="text-green-600" size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={webhookUrls?.facebook.configured ? 'text-green-600 font-medium' : ''}>
                  Email
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex px-8">
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'whatsapp'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                WhatsApp Setup
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'email'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Email Setup
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {activeTab === 'whatsapp' && webhookUrls && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Step 1: Configure Facebook Developer Console</h3>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-blue-800 mb-2">
                      Copy these values and paste them in your Facebook Developer Console:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook URL
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={webhookUrls.whatsapp.webhookUrl}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(webhookUrls.whatsapp.webhookUrl, 'webhook')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          {copiedField === 'webhook' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verify Token
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={webhookUrls.whatsapp.verifyToken}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(webhookUrls.whatsapp.verifyToken, 'verify')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          {copiedField === 'verify' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Step 2: Enter WhatsApp Business Credentials</h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Access Token *
                      </label>
                      <input
                        type="text"
                        value={credentials.whatsapp.accessToken}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          whatsapp: { ...credentials.whatsapp, accessToken: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your WhatsApp Business API access token"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number ID *
                      </label>
                      <input
                        type="text"
                        value={credentials.whatsapp.phoneNumberId}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          whatsapp: { ...credentials.whatsapp, phoneNumberId: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your phone number ID"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Account ID
                      </label>
                      <input
                        type="text"
                        value={credentials.whatsapp.businessAccountId}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          whatsapp: { ...credentials.whatsapp, businessAccountId: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your business account ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        App Secret
                      </label>
                      <input
                        type="password"
                        value={credentials.whatsapp.appSecret}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          whatsapp: { ...credentials.whatsapp, appSecret: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your app secret"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={18} />
                          Saving...
                        </>
                      ) : (
                        'Save WhatsApp Credentials'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Email/SMTP Configuration</h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SMTP Host *
                        </label>
                        <input
                          type="text"
                          value={credentials.email.host}
                          onChange={(e) => setCredentials({
                            ...credentials,
                            email: { ...credentials.email, host: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="smtp.gmail.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Port *
                        </label>
                        <input
                          type="number"
                          value={credentials.email.port}
                          onChange={(e) => setCredentials({
                            ...credentials,
                            email: { ...credentials.email, port: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="587"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={credentials.email.user}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          email: { ...credentials.email, user: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your-email@gmail.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password / App Password *
                      </label>
                      <input
                        type="password"
                        value={credentials.email.pass}
                        onChange={(e) => setCredentials({
                          ...credentials,
                          email: { ...credentials.email, pass: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter password or app-specific password"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For Gmail, use an App Password. <a href="https://support.google.com/accounts/answer/185833" target="_blank" className="text-blue-600 hover:underline">Learn how</a>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={18} />
                          Saving...
                        </>
                      ) : (
                        'Save Email Credentials'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Skip for now
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center font-medium"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
