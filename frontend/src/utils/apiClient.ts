import axios from 'axios';

const API_BASE = process.env.VITE_API_BASE || 'https://api.example.com/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Simple refresh attempt on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  })
  failedQueue = [];
}

api.interceptors.response.use((res) => res, async (err) => {
  const originalRequest = err.config;
  if (err.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        failedQueue.push({resolve, reject})
      }).then(token => {
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return axios(originalRequest);
      })
    }

    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const r = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
      const newToken = r.data.access_token;
      localStorage.setItem('access_token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      processQueue(null, newToken);
      return api(originalRequest);
    } catch (e) {
      processQueue(e, null);
      // redirect to login
      window.location.href = '/login';
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(err);
});

export default api;
