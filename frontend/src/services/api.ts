import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const response = await axios.post<ApiResponse<AuthResponse>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );
          
          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            useAuthStore.getState().setTokens(accessToken, newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  
  register: (data: RegisterRequest) => 
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),
  
  refresh: (refreshToken: string) => 
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),
  
  logout: (refreshToken: string) => 
    api.post('/auth/logout', { refreshToken }),

  oauthCallback: (provider: string, code: string, state?: string | null) =>
    api.post<ApiResponse<AuthResponse>>(`/auth/oauth2/callback/${provider}`, null, { 
      params: { code, state } 
    }),
};

// Users API
export const usersApi = {
  getMe: () => api.get('/users/me'),
  getAll: (params?: { page?: number; size?: number }) => 
    api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: unknown) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Accounts API
export const accountsApi = {
  getAll: (params?: { page?: number; size?: number }) => 
    api.get('/accounts', { params }),
  getById: (id: string) => api.get(`/accounts/${id}`),
  search: (q: string, params?: { page?: number; size?: number }) => 
    api.get('/accounts/search', { params: { q, ...params } }),
  create: (data: unknown) => api.post('/accounts', data),
  update: (id: string, data: unknown) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

// Customers API
export const customersApi = {
  getAll: (params?: { page?: number; size?: number }) => 
    api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  search: (q: string, params?: { page?: number; size?: number }) => 
    api.get('/customers/search', { params: { q, ...params } }),
  getLeads: (params?: { page?: number; size?: number }) => 
    api.get('/customers/leads', { params }),
  getByStatus: (status: string, params?: { page?: number; size?: number }) => 
    api.get(`/customers/status/${status}`, { params }),
  create: (data: unknown) => api.post('/customers', data),
  update: (id: string, data: unknown) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Interactions API
export const interactionsApi = {
  getAll: (params?: { page?: number; size?: number }) => 
    api.get('/interactions', { params }),
  getById: (id: string) => api.get(`/interactions/${id}`),
  getByCustomer: (customerId: string, params?: { page?: number; size?: number }) => 
    api.get(`/interactions/customer/${customerId}`, { params }),
  getByAccount: (accountId: string, params?: { page?: number; size?: number }) => 
    api.get(`/interactions/account/${accountId}`, { params }),
  getByType: (type: string, params?: { page?: number; size?: number }) => 
    api.get(`/interactions/type/${type}`, { params }),
  getByDateRange: (startDate: string, endDate: string, params?: { page?: number; size?: number }) => 
    api.get('/interactions/date-range', { params: { startDate, endDate, ...params } }),
  create: (data: unknown) => api.post('/interactions', data),
  update: (id: string, data: unknown) => api.put(`/interactions/${id}`, data),
  delete: (id: string) => api.delete(`/interactions/${id}`),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: { page?: number; size?: number }) => 
    api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  getMyTasks: (params?: { page?: number; size?: number }) => 
    api.get('/tasks/my-tasks', { params }),
  getByStatus: (status: string, params?: { page?: number; size?: number }) => 
    api.get(`/tasks/status/${status}`, { params }),
  getOverdue: () => api.get('/tasks/overdue'),
  create: (data: unknown) => api.post('/tasks', data),
  update: (id: string, data: unknown) => api.put(`/tasks/${id}`, data),
  complete: (id: string) => api.post(`/tasks/${id}/complete`),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// AI API
export const aiApi = {
  chat: (message: string, context?: unknown) => 
    api.post('/ai/chat', { message, context }),
  summarize: (entityType: string, entityId: string) => 
    api.post('/ai/summarize', { entityType, entityId }),
  getInsights: (customerId: string) => 
    api.get(`/ai/insights/${customerId}`),
};

// Issues API (Jira/Linear integration)
export const issuesApi = {
  getAll: (params?: { page?: number; size?: number }) => 
    api.get('/issues', { params }),
  getById: (id: string) => api.get(`/issues/${id}`),
  getByCustomer: (customerId: string, params?: { page?: number; size?: number }) => 
    api.get(`/issues/customer/${customerId}`, { params }),
  getByStatus: (status: string, params?: { page?: number; size?: number }) => 
    api.get(`/issues/status/${status}`, { params }),
  create: (data: unknown) => api.post('/issues', data),
  update: (id: string, data: unknown) => api.put(`/issues/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/issues/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/issues/${id}`),
  syncFromJira: () => api.post('/issues/sync/jira'),
  syncFromLinear: () => api.post('/issues/sync/linear'),
};

export default api;

