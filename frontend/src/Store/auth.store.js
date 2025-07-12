import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required to send/receive cookies
  timeout: 10000,
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      loading: false,
      checkingAuth: true,

      setCheckingAuth: (status) => set({ checkingAuth: status }),

      signup: async ({ firstName, lastName, username, email, password, confirmPassword }) => {
        set({ loading: true });

        try {
          const res = await axiosInstance.post('/auth/signup', {
            firstName,
            lastName,
            username,
            email,
            password,
            confirmPassword,
          });

          set({
            user: res.data.user,
            loading: false,
          });

          console.log('Signup successful:', res.data.user);
          toast.success('Signup successful');
          return res.data;
        } catch (error) {
          console.error('Signup error:', error);
          set({ loading: false });
          const errorMessage = error.response?.data?.message || 'An error occurred during signup';
          toast.error(errorMessage);
          throw error;
        }
      },

      login: async ({ email, password }) => {
        set({ loading: true });

        try {
          const res = await axiosInstance.post('/auth/login', { email, password });

          set({
            user: res.data.user,
            loading: false,
          });

          console.log('Login successful:', res.data.user);
          toast.success('Logged in successfully');
          return res.data;
        } catch (error) {
          console.error('Login error:', error);
          set({ loading: false });
          const errorMessage = error.response?.data?.message || 'Login failed';
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: async () => {
        try {
          await axiosInstance.post('/auth/logout');
          set({ user: null });
          console.log('Logout successful');
          toast.success('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
          set({ user: null }); // Clear state even if server request fails
          const errorMessage = error.response?.data?.message || 'Logout failed';
          toast.error(errorMessage);
        }
      },

      checkAuth: async () => {
        set({ checkingAuth: true });

        try {
          const response = await axiosInstance.get('/auth/profile');

          set({
            user: response.data,
            checkingAuth: false,
          });

          console.log('Auth check successful:', response.data);
          return response.data;
        } catch (error) {
          console.error('Auth check error:', error);
          set({
            checkingAuth: false,
            user: null,
          });
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);