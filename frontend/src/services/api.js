import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (projectId, email) =>
    api.post(`/projects/${projectId}/members`, { email }),
  removeMember: (projectId, userId) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

// ─── TASKS ───────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getOne: (projectId, taskId) =>
    api.get(`/projects/${projectId}/tasks/${taskId}`),
  create: (projectId, data) =>
    api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId, taskId, data) =>
    api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId, taskId) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: (projectId) => api.get(`/projects/${projectId}/dashboard`),
};

export default api;
