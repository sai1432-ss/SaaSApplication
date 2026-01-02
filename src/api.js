import axios from 'axios';

// 1. Create the Axios Instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Add a Request Interceptor 
// This automatically adds the Token to EVERY request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // We will store token here on Login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;