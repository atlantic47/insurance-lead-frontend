import axios from 'axios';
import { AuthResponse, User, Lead, Communication, Product, Client, Task, AIConversation, PaginationResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage');
    console.log('🔍 API Request interceptor - authStorage exists:', !!authStorage);
    if (authStorage) {
      try {
        const parsedAuth = JSON.parse(authStorage);
        const token = parsedAuth.state?.token;
        console.log('📝 Token from storage:', token ? token.substring(0, 20) + '...' : 'null');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Added Authorization header');
        } else {
          console.log('❌ No token found in parsed auth');
        }
      } catch (error) {
        console.error('❌ Failed to parse auth storage:', error);
      }
    } else {
      console.log('❌ No auth storage found');
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  registerTenant: (data: {
    companyName: string;
    subdomain: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
    adminPhone?: string;
    plan?: string;
  }) => api.post<any>('/auth/register-tenant', data),
  me: () => api.get<User>('/auth/me'),
};

export const tenantsApi = {
  getCurrent: () => api.get('/tenants/current'),
  getOnboardingStatus: () => api.get('/tenants/onboarding-status'),
  setupCredentials: (data: {
    whatsapp?: {
      accessToken: string;
      phoneNumberId: string;
      webhookVerifyToken?: string;
      businessAccountId?: string;
      appSecret?: string;
    };
    facebook?: {
      accessToken: string;
      pageId: string;
      appSecret?: string;
      webhookVerifyToken?: string;
    };
    email?: {
      host: string;
      port: number;
      user: string;
      pass: string;
      secure?: boolean;
    };
  }) => api.put('/tenants/setup-credentials', data),
  getWebhookUrls: () => api.get('/tenants/webhook-urls'),
  completeOnboarding: () => api.put('/tenants/complete-onboarding'),
  getTrialStatus: () => api.get('/tenants/trial-status'),
};

export const leadsApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<Lead>>('/leads', { params }),
  getById: (id: string) => api.get<Lead>(`/leads/${id}`),
  create: (data: Record<string, unknown>) => api.post<Lead>('/leads', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Lead>(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  updateStatus: (id: string, status: string) => api.patch<Lead>(`/leads/${id}/pipeline/move`, { status }),
  assign: (id: string, userId: string) => api.patch<Lead>(`/leads/${id}/assign/${userId}`),
};

export const communicationsApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<Communication>>('/communications', { params }),
  getByLead: (leadId: string) => api.get<Communication[]>(`/communications/lead/${leadId}`),
  create: (data: Record<string, unknown>) => api.post<Communication>('/communications', data),
  markAsRead: (id: string) => api.patch(`/communications/${id}/read`),
};

export const productsApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<Product>>('/products', { params }),
  getById: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post<Product>('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const clientsApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<Client>>('/clients', { params }),
  getById: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: Record<string, unknown>) => api.post<Client>('/clients', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const tasksApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<Task>>('/tasks', { params }),
  getById: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (data: Record<string, unknown>) => api.post<Task>('/tasks', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Task>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateStatus: (id: string, status: string) => api.patch<Task>(`/tasks/${id}/status`, { status }),
};

export const usersApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<User>>('/users', { params }),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post<User>('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getUserStats: (id: string) => api.get(`/users/${id}/stats`),
};

export const aiApi = {
  getConversations: (params?: Record<string, unknown>) => api.get<PaginationResponse<AIConversation>>('/ai/conversations', { params }),
  chat: (message: string, leadId?: string) => api.post<AIConversation>('/ai/chatbot', { input: message, leadId }),
  analyzeSentiment: (text: string) => api.post('/ai/sentiment', { text }),
  uploadTrainingFiles: (files: FileList, instructions: string) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    formData.append('instructions', instructions);
    return api.post('/ai/training/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  scanUrl: (url: string, instructions: string) => api.post('/ai/training/scan-url', { url, instructions }),
  saveUrl: (url: string, instructions: string) => api.post('/ai/training/scan-url', { url, instructions }), // Process URL immediately
  submitTraining: (instructions: string, urls: string[]) => api.post('/ai/training/submit', { instructions, urls }),
  testAi: (message: string) => api.post('/ai/training/test', { message }),
  getTrainingData: () => api.get('/ai/training/data'),
  deleteTrainingData: (id: string) => api.delete(`/ai/training/data/${id}`),
  updateTrainingData: (id: string, data: { instructions: string }) => api.put(`/ai/training/data/${id}`, data),
  getWidgetConfig: () => api.get('/ai/widget/config/settings'),
  saveWidgetConfig: (config: any) => api.put('/ai/widget/config/settings', config),
};

export const chatApi = {
  getConversations: (params?: Record<string, unknown>) => 
    api.get<PaginationResponse<any>>('/chat/conversations', { params }),
  getConversation: (leadId: string) => 
    api.get<any>(`/chat/conversations/${leadId}`),
  sendMessage: (data: { leadId: string; message: string; conversationId?: string }) =>
    api.post('/chat/send-message', data),
  escalateConversation: (conversationId: string, data?: { reason?: string }) =>
    api.post(`/chat/conversations/${conversationId}/escalate`, data),
  webhookWhatsApp: (data: { phoneNumber: string; message: string; senderName?: string }) =>
    api.post('/chat/webhook/whatsapp', data),
};

export const emailApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<any>>('/email', { params }),
  getByLead: (leadId: string) => api.get<any[]>(`/email/lead/${leadId}`),
  getThreads: (params?: Record<string, unknown>) => api.get<PaginationResponse<any>>('/email/threads', { params }),
  getThread: (threadId: string) => api.get<any[]>(`/email/thread/${threadId}`),
  send: (data: {
    toEmail: string;
    subject: string;
    content: string;
    inReplyTo?: string;
    threadId?: string;
    leadId?: string;
    ccEmails?: string[];
    bccEmails?: string[];
  }) => api.post('/email/send', data),
  markAsRead: (emailId: string) => api.patch(`/email/${emailId}/read`),
  getStats: () => api.get('/email/stats'),
  fetchEmails: () => api.post('/email/fetch'),
  testConnection: () => api.post('/email/test-connection'),
  webhookFetch: () => api.post('/email/webhook/fetch'),
  getContacts: (search?: string) => api.get('/email/contacts', { params: { search } }),
};

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getLeadMetrics: (params?: Record<string, unknown>) => api.get('/reports/leads', { params }),
  getPerformance: (params?: Record<string, unknown>) => api.get('/reports/performance', { params }),
  exportData: (type: string, params?: Record<string, unknown>) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

export const contactGroupsApi = {
  getAll: () => api.get('/contact-groups'),
  getById: (id: string) => api.get(`/contact-groups/${id}`),
  create: (data: { name: string; description?: string; type: string; color?: string; leadIds?: string[] }) =>
    api.post('/contact-groups', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/contact-groups/${id}`, data),
  delete: (id: string) => api.delete(`/contact-groups/${id}`),
  addLeads: (id: string, leadIds: string[]) => api.post(`/contact-groups/${id}/leads`, { leadIds }),
  removeLead: (groupId: string, leadId: string) => api.delete(`/contact-groups/${groupId}/leads/${leadId}`),
  getContacts: (id: string) => api.get(`/contact-groups/${id}/contacts`),
};

export const campaignsApi = {
  // Campaign Templates
  getAllTemplates: (params?: { type?: 'WHATSAPP' | 'EMAIL' }) => api.get('/campaigns/templates', { params }),
  getTemplate: (id: string) => api.get(`/campaigns/templates/${id}`),
  createTemplate: (data: {
    name: string;
    description?: string;
    type: 'WHATSAPP' | 'EMAIL';
    subject?: string;
    content: string;
    htmlContent?: string;
    isHtml?: boolean;
    variables?: any;
    whatsappTemplateName?: string;
    whatsappLanguageCode?: string;
    whatsappComponents?: any;
    whatsappParameters?: any;
  }) => api.post('/campaigns/templates', data),
  updateTemplate: (id: string, data: Record<string, unknown>) => api.patch(`/campaigns/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/campaigns/templates/${id}`),

  // Campaigns
  getAll: (params?: { type?: 'WHATSAPP' | 'EMAIL'; status?: string }) => api.get('/campaigns', { params }),
  getById: (id: string) => api.get(`/campaigns/${id}`),
  create: (data: {
    name: string;
    description?: string;
    type: 'WHATSAPP' | 'EMAIL';
    templateId?: string;
    subject?: string;
    content?: string;
    contactGroupId: string;
    scheduledAt?: string;
  }) => api.post('/campaigns', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/campaigns/${id}`, data),
  delete: (id: string) => api.delete(`/campaigns/${id}`),
  send: (id: string) => api.post(`/campaigns/${id}/send`),
  getStats: () => api.get('/campaigns/stats'),

  // Email Templates (Predefined)
  getPredefinedEmailTemplates: () => api.get('/campaigns/email/templates/predefined'),

  // Upload HTML Template
  uploadHtmlTemplate: (file: File, data: { name: string; description?: string; subject?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', data.name);
    formData.append('type', 'EMAIL');
    if (data.description) formData.append('description', data.description);
    if (data.subject) formData.append('subject', data.subject);

    return api.post('/campaigns/templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // WhatsApp Templates from Meta
  getWhatsAppTemplates: () => api.get('/campaigns/whatsapp/templates'),
  getWhatsAppTemplateStructure: (name: string, language: string = 'en') =>
    api.get(`/campaigns/whatsapp/templates/${name}`, { params: { language } }),
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  getByCategory: (category: string) => api.get(`/settings/${category}`),
  updateMultiple: (settings: Array<{
    category: string;
    key: string;
    value: string;
    isEncrypted?: boolean;
    description?: string;
  }>) => api.post('/settings/bulk-update', settings),
};

export const credentialsApi = {
  // Email Credentials
  getEmailCredentials: () => api.get('/credentials/email'),
  getEmailCredential: (id: string) => api.get(`/credentials/email/${id}`),
  getDefaultEmailCredential: () => api.get('/credentials/email/default'),
  createEmailCredential: (data: any) => api.post('/credentials/email', data),
  updateEmailCredential: (id: string, data: any) => api.patch(`/credentials/email/${id}`, data),
  deleteEmailCredential: (id: string) => api.delete(`/credentials/email/${id}`),
  setDefaultEmailCredential: (id: string) => api.post(`/credentials/email/${id}/set-default`),
  testEmailCredential: (id: string) => api.post(`/credentials/email/${id}/test`),

  // WhatsApp Credentials
  getWhatsAppCredentials: () => api.get('/credentials/whatsapp'),
  getWhatsAppCredential: (id: string) => api.get(`/credentials/whatsapp/${id}`),
  getDefaultWhatsAppCredential: () => api.get('/credentials/whatsapp/default'),
  getDefaultWhatsAppWebhookInfo: () => api.get('/credentials/whatsapp/default/webhook'),
  getWhatsAppWebhookInfo: (id: string) => api.get(`/credentials/whatsapp/${id}/webhook`),
  createWhatsAppCredential: (data: any) => api.post('/credentials/whatsapp', data),
  updateWhatsAppCredential: (id: string, data: any) => api.patch(`/credentials/whatsapp/${id}`, data),
  deleteWhatsAppCredential: (id: string) => api.delete(`/credentials/whatsapp/${id}`),
  setDefaultWhatsAppCredential: (id: string) => api.post(`/credentials/whatsapp/${id}/set-default`),
  regenerateWhatsAppWebhook: (id: string) => api.post(`/credentials/whatsapp/${id}/regenerate-webhook`),
};

export const whatsappApi = {
  // WhatsApp Templates
  getTemplates: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/whatsapp/templates', { params }),
  getTemplate: (id: string) => api.get(`/whatsapp/templates/${id}`),
  createTemplate: (data: {
    name: string;
    category: string;
    language: string;
    headerFormat?: string;
    headerText?: string;
    body: string;
    footer?: string;
    buttons?: any[];
    bodyExamples?: string[];
    headerExamples?: string[];
    submitToMeta?: boolean;
  }) => api.post('/whatsapp/templates', data),
  updateTemplate: (id: string, data: any) => api.patch(`/whatsapp/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/whatsapp/templates/${id}`),
  submitTemplate: (id: string) => api.post(`/whatsapp/templates/${id}/submit`),
  resubmitTemplate: (id: string) => api.post(`/whatsapp/templates/${id}/resubmit`),
  getTemplateStatus: (id: string) => api.get(`/whatsapp/templates/${id}/status`),
  syncTemplates: () => api.post('/whatsapp/templates/sync'),

  // Send template to conversation
  sendTemplateToConversation: (conversationId: string, data: {
    templateName: string;
    templateParams?: {
      header?: string | string[];
      body?: string | string[];
      buttons?: any[];
      languageCode?: string;
    };
  }) => api.post(`/whatsapp/conversations/${conversationId}/send-template`, data),

  // Conversation Labels
  addLabelToConversation: (conversationId: string, labelId: string) =>
    api.post(`/whatsapp/conversation-labels/assign`, { conversationId, labelId }),
  removeLabelFromConversation: (conversationId: string, labelId: string) =>
    api.delete(`/whatsapp/conversation-labels/conversations/${conversationId}/labels/${labelId}`),
  getConversationLabels: (conversationId: string) =>
    api.get(`/whatsapp/conversation-labels/conversations/${conversationId}`),
  getAllLabels: () =>
    api.get('/whatsapp/conversation-labels'),
};

export default api;