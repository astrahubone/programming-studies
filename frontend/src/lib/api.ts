import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'https://programming-studies-server.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
    if (token) {
      const parsedToken = JSON.parse(token);
      if (parsedToken?.access_token) {
        config.headers.Authorization = `Bearer ${parsedToken.access_token}`;
        console.log('API: Added auth token to request');
      }
    }
  } catch (error) {
    console.error('API: Error parsing auth token:', error);
    localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`API: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`, error.response?.data);
    
    if (error.response?.status === 401) {
      // Clear token and redirect to login only if we're not already on the login or register page
      const currentPath = window.location.pathname;
      if (!['/login', '/register', '/admin/login'].includes(currentPath)) {
        console.log('API: 401 error, clearing token and redirecting to login');
        localStorage.removeItem('sb-cbqwhkjttgkckhrdwhnx-auth-token');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default api;