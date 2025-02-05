import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1',
  withCredentials: true,
});

// Fetch CSRF token and set it for all requests
api.get('/auth/csrf-token')
  .then(response => {
    api.defaults.headers.common['X-CSRF-Token'] = response.data.csrfToken;
  })
  .catch(error => {
    console.error('Error fetching CSRF token:', error);
  });

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to signin if:
    // 1. It's a 401 error
    // 2. We're not already on the signin page
    // 3. We're not trying to fetch the CSRF token
    // 4. We're not on the home page
    if (
      error.response?.status === 401 && 
      !window.location.pathname.includes('/signin') &&
      !error.config.url.includes('/csrf-token') &&
      window.location.pathname !== '/'
    ) {
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;