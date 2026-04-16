import { api } from './api';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}

export const auth = {
  login: async (email: string, password: string, role: 'patient' | 'doctor') => {
    const endpoint = role === 'doctor' ? '/api/doctors/auth/login' : '/api/patients/auth/login';
    const data = await api.post(endpoint, { email, password });
    if (data.token) {
      const userData = data.patient || data.doctor;
      // Use the actual role from the database (handles admin accounts stored as patients)
      const actualRole = userData?.role || role;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...userData, role: actualRole }));
    }
    return data;
  },
  adminLogin: async (email: string, password: string) => {
    const data = await api.post('/api/patients/auth/login', { email, password });
    if (data.token) {
      const userData = data.patient;
      if (userData?.role !== 'admin') {
        throw new Error('Access denied. Admin account required.');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...userData, role: 'admin' }));
    }
    return data;
  },
  register: async (userData: Record<string, unknown>, role: 'patient' | 'doctor') => {
    const endpoint = role === 'doctor' ? '/api/doctors/auth/register' : '/api/patients/auth/register';
    const data = await api.post(endpoint, userData);
    if (data.token) {
      const user = data.patient || data.doctor;
      const actualRole = user?.role || role;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...user, role: actualRole }));
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },
};
