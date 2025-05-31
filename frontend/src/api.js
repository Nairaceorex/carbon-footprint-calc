import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = async (username, password) => {
  const response = await api.post('/register', { username, password });
  return response.data;
};

export const login = async ({ username, password }) => {
  try {
    const response = await api.post(
      '/token',
      new URLSearchParams({ username, password }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Login failed' };
  }
};

export const calculate = async (inputs) => {
  const response = await api.post('/calculate', inputs); // Line 26
  return response.data;
};

export const getCalculations = async () => {
  const response = await api.get('/calculations');
  return response.data;
};