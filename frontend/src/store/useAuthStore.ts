import { create } from 'zustand';
import { api } from '../lib/api';
import type { User, Address } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  addresses: Address[];

  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string, phone?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('swiftmart_token'),
  isLoading: false,
  isAuthModalOpen: false,
  authModalTab: 'login',
  addresses: [],

  openAuthModal: (tab = 'login') => {
    set({ isAuthModalOpen: true, authModalTab: tab });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data;
      localStorage.setItem('swiftmart_token', access_token);
      set({ token: access_token, user, isAuthModalOpen: false, isLoading: false });
      await get().fetchAddresses();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (email, password, fullName, phone) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        phone,
      });
      const { access_token, user } = res.data;
      localStorage.setItem('swiftmart_token', access_token);
      set({ token: access_token, user, isAuthModalOpen: false, isLoading: false });
      await get().fetchAddresses();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('swiftmart_token');
    set({ token: null, user: null, addresses: [] });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('swiftmart_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, token });
      await get().fetchAddresses();
    } catch {
      localStorage.removeItem('swiftmart_token');
      set({ user: null, token: null });
    }
  },

  fetchAddresses: async () => {
    const token = localStorage.getItem('swiftmart_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/addresses');
      set({ addresses: res.data });
    } catch {
      // ignore
    }
  },

  addAddress: async (addressData) => {
    const res = await api.post('/auth/addresses', addressData);
    const newAddr = res.data;
    set((state) => ({ addresses: [...state.addresses, newAddr] }));
    return newAddr;
  },
}));
