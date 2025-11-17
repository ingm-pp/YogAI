import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services API
export const authAPI = {
  login: (email, password) => 
    api.post('/api/login', { email, password }),
  
  register: (email, password, firstName = '') => 
    api.post('/api/register', { email, password, firstName }),
  
  getProfile: () => 
    api.get('/api/me'),
};

export const postureAPI = {
  getAvailablePostures: () => 
    api.get('/api/postures/available'),
  
  analyzePose: (formData) => 
    api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export const userAPI = {
  getHistory: () => 
    api.get('/api/user/history'),
  
  getStats: () => 
    api.get('/api/user/stats'),
  
  getDetailedStats: () => 
    api.get('/api/user/detailed-stats'),
  
  updateProfile: (profileData) => 
    api.put('/api/user/profile', profileData),

  clearHistory: () => api.delete('/api/user/history')  
};

export default api;