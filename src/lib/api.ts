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
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
};

export const leadsApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<Lead>>('/leads', { params }),
  getById: (id: string) => api.get<Lead>(`/leads/${id}`),
  create: (data: Record<string, unknown>) => api.post<Lead>('/leads', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Lead>(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  updateStatus: (id: string, status: string) => api.patch<Lead>(`/leads/${id}/status`, { status }),
  assign: (id: string, userId: string) => api.patch<Lead>(`/leads/${id}/assign`, { userId }),
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
  update: (id: string, data: Record<string, unknown>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const clientsApi = {
  getAll: (params?: Record<string, unknown>) => api.get<PaginationResponse<Client>>('/clients', { params }),
  getById: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: Record<string, unknown>) => api.post<Client>('/clients', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Client>(`/clients/${id}`, data),
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
  update: (id: string, data: Record<string, unknown>) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const aiApi = {
  getConversations: (params?: Record<string, unknown>) => api.get<PaginationResponse<AIConversation>>('/ai/conversations', { params }),
  chat: (message: string, leadId?: string) => api.post<AIConversation>('/ai/chat', { message, leadId }),
  analyzeSentiment: (text: string) => api.post('/ai/sentiment', { text }),
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

export default api;