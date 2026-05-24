import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to inject JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired/invalid, clear auth details
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // We can also trigger a redirect or page refresh to login if needed
    }
    return Promise.reject(error);
  }
);

export default API;
