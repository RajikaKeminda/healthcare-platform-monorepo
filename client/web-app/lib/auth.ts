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
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.patient || data.doctor, role }));
    }
    return data;
  },
  register: async (userData: Record<string, unknown>, role: 'patient' | 'doctor') => {
    const endpoint = role === 'doctor' ? '/api/doctors/auth/register' : '/api/patients/auth/register';
    const data = await api.post(endpoint, userData);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.patient || data.doctor, role }));
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
