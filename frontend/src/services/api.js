import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if not on auth routes (login/register)
    const isAuthRoute = error.config?.url?.includes('/auth/login') || 
                        error.config?.url?.includes('/auth/register') ||
                        error.config?.url?.includes('/auth/me');
    
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getPendingTeachers: () => api.get('/users/pending-teachers'),
  approve: (id) => api.put(`/users/${id}/approve`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
};

// Sample Problems API
export const sampleProblemsAPI = {
  getAll: (params) => api.get('/sample-problems', { params }),
  getById: (id) => api.get(`/sample-problems/${id}`),
  create: (data) => api.post('/sample-problems', data),
  update: (id, data) => api.put(`/sample-problems/${id}`, data),
  delete: (id) => api.delete(`/sample-problems/${id}`),
};

// Competition Problems API
export const competitionProblemsAPI = {
  getAll: () => api.get('/competition-problems'),
  getById: (id) => api.get(`/competition-problems/${id}`),
  create: (data) => api.post('/competition-problems', data),
  update: (id, data) => api.put(`/competition-problems/${id}`, data),
  delete: (id) => api.delete(`/competition-problems/${id}`),
};

// Lobbies API
export const lobbiesAPI = {
  getAll: (params) => api.get('/lobbies', { params }),
  getMyMatches: () => api.get('/lobbies/my-matches'),
  getById: (id) => api.get(`/lobbies/${id}`),
  create: (data) => api.post('/lobbies', data),
  join: (accessCode) => api.post('/lobbies/join', { accessCode }),
  start: (id) => api.put(`/lobbies/${id}/start`),
  end: (id) => api.put(`/lobbies/${id}/end`),
  getLeaderboard: (id) => api.get(`/lobbies/${id}/leaderboard`),
  delete: (id) => api.delete(`/lobbies/${id}`),
  nextProblem: (id) => api.put(`/lobbies/${id}/next-problem`),
  revealProblem: (id) => api.put(`/lobbies/${id}/reveal-problem`),
};

// Submissions API
export const submissionsAPI = {
  submit: (data) => api.post('/submissions', data),
  getAll: (params) => api.get('/submissions', { params }),
  getById: (id) => api.get(`/submissions/${id}`),
  getByLobby: (lobbyId) => api.get(`/submissions/lobby/${lobbyId}`),
};

export default api;
