import axios from 'axios';

// API Configuration
const normalizeApiBaseUrl = (url) => {
  if (!url) return url;
  const trimmed = String(url).trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const resolveApiBaseUrl = () => {
  const envBaseUrl = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);

  // If an API URL is explicitly provided in env, use it everywhere
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // Fallback to production server
  return normalizeApiBaseUrl('https://sverxiioo.nanoprofiles.com/api');
};

const API_BASE_URL = resolveApiBaseUrl();
console.log('[Admin API] Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Auth API
export const authAPI = {
  login: async (firebaseToken) => {
    const response = await api.post('/auth/login', {}, {
      headers: { Authorization: `Bearer ${firebaseToken}` }
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (firebaseToken) => {
    const response = await api.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${firebaseToken}` }
    });
    return response.data;
  },

  // Admin OTP Authentication
  requestAdminOTP: async (username) => {
    const response = await api.post('/auth/admin/request-otp', { username });
    return response.data;
  },

  verifyAdminOTP: async (username, otp) => {
    const response = await api.post('/auth/admin/verify-otp', { username, otp });
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  promoteUser: async (id, data) => {
    const response = await api.post(`/admin/users/${id}/promote`, data);
    return response.data;
  },

  getProducts: async (params = {}) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  getEvents: async (params = {}) => {
    const response = await api.get('/admin/events', { params });
    return response.data;
  },

  getEventRegisteredParticipants: async (eventId) => {
    const response = await api.get(`/admin/events/${eventId}/registered-participants`);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await api.put(`/admin/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/admin/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  // Gallery
  getGallery: async (params = {}) => {
    const response = await api.get('/admin/gallery', { params });
    return response.data;
  },

  createGalleryItem: async (payload) => {
    const response = await api.post('/admin/gallery', payload);
    return response.data;
  },

  updateGalleryItem: async (id, payload) => {
    const response = await api.put(`/admin/gallery/${id}`, payload);
    return response.data;
  },

  deleteGalleryItem: async (id) => {
    const response = await api.delete(`/admin/gallery/${id}`);
    return response.data;
  },

  uploadGalleryImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  uploadEventImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/events/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Artists
  getArtists: async (params = {}) => {
    const response = await api.get('/admin/artists', { params });
    return response.data;
  },
  createArtist: async (payload) => {
    const response = await api.post('/admin/artists', payload);
    return response.data;
  },
  updateArtist: async (id, payload) => {
    const response = await api.put(`/admin/artists/${id}`, payload);
    return response.data;
  },
  deleteArtist: async (id) => {
    const response = await api.delete(`/admin/artists/${id}`);
    return response.data;
  },
  uploadArtistImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/artists/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  bulkUploadArtists: async (csvText, sendEmails = true) => {
    const response = await api.post('/admin/artists/bulk-upload', { csvText, sendEmails });
    return response.data;
  },
  uploadHeroImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/announcements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  sendBulkAnnouncementEmail: async (payload) => {
    const response = await api.post('/admin/announcements/bulk-email', payload);
    return response.data;
  },
  broadcastMessageToArtists: async (text) => {
    const response = await api.post('/admin/artists/broadcast-message', { text });
    return response.data;
  },
  getPayments: async () => {
    const response = await api.get('/payments/admin/all');
    return response.data;
  },
  deletePayment: async (id) => {
    const response = await api.delete(`/payments/admin/${id}`);
    return response.data;
  },
  uploadHeroLogo: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/announcements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Forms
  getForms: async (params = {}) => {
    const response = await api.get('/forms/admin/forms', { params });
    return response.data;
  },
  getForm: async (id) => {
    const response = await api.get(`/forms/admin/forms/${id}`);
    return response.data;
  },
  createForm: async (payload) => {
    const response = await api.post('/forms/admin/forms', payload);
    return response.data;
  },
  updateForm: async (id, payload) => {
    const response = await api.put(`/forms/admin/forms/${id}`, payload);
    return response.data;
  },
  deleteForm: async (id) => {
    const response = await api.delete(`/forms/admin/forms/${id}`);
    return response.data;
  },
  getFormSubmissions: async (formId, params = {}) => {
    const response = await api.get(`/forms/admin/forms/${formId}/submissions`, { params });
    return response.data;
  },
  updateSubmissionStatus: async (submissionId, status) => {
    const response = await api.put(`/forms/admin/submissions/${submissionId}/status`, { status });
    return response.data;
  },
  getSubmissionsOverview: async () => {
    const response = await api.get('/forms/admin/submissions');
    return response.data;
  },

  // Event Subscribers
  getSubscribers: async (params = {}) => {
    const response = await api.get('/forms/admin/subscribers', { params });
    return response.data;
  },
  updateSubscriber: async (id, data) => {
    const response = await api.put(`/forms/admin/subscribers/${id}`, data);
    return response.data;
  },
  deleteSubscriber: async (id) => {
    const response = await api.delete(`/forms/admin/subscribers/${id}`);
    return response.data;
  },
};

// ArtDistrict API (admin)
export const artDistrictAPI = {
  // Config (prices + payment link)
  getConfig: async () => {
    const response = await api.get('/admin/art-district/config');
    return response.data;
  },
  updateConfig: async (payload) => {
    const response = await api.put('/admin/art-district/config', payload);
    return response.data;
  },

  // Gallery management
  getGallery: async () => {
    const response = await api.get('/admin/art-district/gallery');
    return response.data;
  },
  updateGallery: async (galleryImages) => {
    const response = await api.put('/admin/art-district/gallery', { galleryImages });
    return response.data;
  },
  uploadGalleryImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/art-district/gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Registrations
  getRegistrations: async (params = {}) => {
    const response = await api.get('/admin/art-district/registrations', { params });
    return response.data;
  },
  createRegistration: async (payload) => {
    const response = await api.post('/admin/art-district/registrations', payload);
    return response.data;
  },
  deleteRegistration: async (id) => {
    const response = await api.delete(`/admin/art-district/registrations/${id}`);
    return response.data;
  },
};

// Coupon Management API
export const couponsAPI = {
  getCoupons: async (params = {}) => {
    const response = await api.get('/coupons', { params });
    return response.data;
  },
  getCoupon: async (id) => {
    const response = await api.get(`/coupons/${id}`);
    return response.data;
  },
  createCoupon: async (couponData) => {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },
  updateCoupon: async (id, couponData) => {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },
  toggleCoupon: async (id) => {
    const response = await api.patch(`/coupons/${id}/toggle`);
    return response.data;
  },
  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },
  validateCoupon: async (payload) => {
    const response = await api.post('/coupons/validate', payload);
    return response.data;
  },
};

// E-Commerce Management & Payments API
export const ecommerceAPI = {
  getSellers: async (params = {}) => {
    const response = await api.get('/ecommerce/sellers', { params });
    return response.data;
  },
  getSellerPayment: async (artistId) => {
    const response = await api.get(`/ecommerce/sellers/${artistId}/payment`);
    return response.data;
  },
  updateSeller: async (artistId, data) => {
    const response = await api.put(`/ecommerce/sellers/${artistId}`, data);
    return response.data;
  },
  getPayments: async (params = {}) => {
    const response = await api.get('/ecommerce/payments', { params });
    return response.data;
  },
  createPayment: async (data) => {
    const response = await api.post('/ecommerce/payments', data);
    return response.data;
  },
  updatePayment: async (id, data) => {
    const response = await api.put(`/ecommerce/payments/${id}`, data);
    return response.data;
  },
  deletePayment: async (id) => {
    const response = await api.delete(`/ecommerce/payments/${id}`);
    return response.data;
  },
};

export default api;
