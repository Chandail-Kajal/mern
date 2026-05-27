import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add token from storage on startup
const stored = localStorage.getItem('user');
if (stored) {
  const { token } = JSON.parse(stored);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;
