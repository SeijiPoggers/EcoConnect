// ─────────────────────────────────────────────────────────
// EcoConnect — API Service Layer
// All HTTP requests to the backend live here.
// ─────────────────────────────────────────────────────────

import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: BASE, timeout: 10000 });

// ── Attach JWT on every request ────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eco_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global error handler ───────────────────────────────
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eco_token');
      localStorage.removeItem('eco_user');
      window.location.href = '/login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

// ── Auth ───────────────────────────────────────────────
export const authAPI = {
  login:    (data)   => api.post('/auth/login', data).then(r => r.data),
  register: (data)   => api.post('/auth/register', data).then(r => r.data),
  me:       ()       => api.get('/auth/me').then(r => r.data),
  logout:   ()       => api.post('/auth/logout').then(r => r.data),
};

// ── Patients ───────────────────────────────────────────
export const patientsAPI = {
  me:     ()   => api.get('/patients/me').then(r => r.data),
  list:   ()   => api.get('/patients').then(r => r.data),
  get:    (id) => api.get(`/patients/${id}`).then(r => r.data),
};

// ── Professionals ──────────────────────────────────────
export const professionalsAPI = {
  me:    () => api.get('/professionals/me').then(r => r.data),
  stats: () => api.get('/professionals/stats').then(r => r.data),
};

// ── Organizations ──────────────────────────────────────
export const orgsAPI = {
  list: (params) => api.get('/organizations', { params }).then(r => r.data),
};

// ── Appointments ───────────────────────────────────────
export const appointmentsAPI = {
  list:   ()     => api.get('/appointments').then(r => r.data),
  create: (data) => api.post('/appointments', data).then(r => r.data),
  cancel: (id, reason) => api.patch(`/appointments/${id}/cancel`, { reason }).then(r => r.data),
};

// ── Objectives ─────────────────────────────────────────
export const objectivesAPI = {
  list:   (patientId) => api.get('/objectives', { params: { patientId } }).then(r => r.data),
  create: (data)      => api.post('/objectives', data).then(r => r.data),
  toggle: (id)        => api.patch(`/objectives/${id}/toggle`).then(r => r.data),
  delete: (id)        => api.delete(`/objectives/${id}`).then(r => r.data),
};

// ── Logs ───────────────────────────────────────────────
export const logsAPI = {
  list:          (patientId) => api.get('/logs', { params: { patientId } }).then(r => r.data),
  create:        (data)      => api.post('/logs', data).then(r => r.data),
  toggleVisible: (id)        => api.patch(`/logs/${id}/visibility`).then(r => r.data),
};

// ── Contact ────────────────────────────────────────────
export const contactAPI = {
  send: (data) => api.post('/contact', data).then(r => r.data),
};

export default api;
