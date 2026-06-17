import api from './api';

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
  review: (bookingId, data) => api.post(`/reviews/booking/${bookingId}`, data)
};

export const chefService = {
  getAll: (params) => api.get('/chefs', { params }),
  getById: (id) => api.get(`/chefs/${id}`),
  getAvailability: (id) => api.get(`/chefs/${id}/availability`),
  updateProfile: (data) => api.put('/chefs/me/profile', data),
  setAvailability: (slots) => api.put('/chefs/me/availability', { slots }),
  addPortfolio: (data) => api.post('/chefs/me/portfolio', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getEarnings: (period) => api.get('/chefs/me/earnings', { params: { period } }),
  updateMenu: (items) => api.put('/chefs/me/menu', { items }),
  updateLocation: (data) => api.post('/chefs/me/location', data)
};

export const menuService = {
  getCategories: () => api.get('/menu/categories'),
  getItems: (params) => api.get('/menu/items', { params }),
  getItemById: (id) => api.get(`/menu/items/${id}`),
  getRecommendations: () => api.get('/menu/recommendations')
};

export const paymentService = {
  initMpesa: (data) => api.post('/payments/mpesa', data),
  initStripe: (bookingId) => api.post('/payments/stripe', { booking_id: bookingId }),
  initPaypal: (bookingId) => api.post('/payments/paypal', { booking_id: bookingId }),
  capturePaypal: (orderId) => api.post('/payments/paypal/capture', { order_id: orderId }),
  getHistory: () => api.get('/payments/history'),
  requestRefund: (paymentId, reason) => api.post('/payments/refund', { payment_id: paymentId, reason })
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  getFavorites: () => api.get('/users/favorites'),
  toggleFavorite: (chefId) => api.post(`/users/favorites/${chefId}`),
  getLoyalty: () => api.get('/users/loyalty'),
  getNotifications: () => api.get('/notifications')
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, is_active) => api.patch(`/admin/users/${id}/status`, { is_active }),
  getPendingChefs: () => api.get('/admin/chefs/pending'),
  verifyChef: (id, status) => api.patch(`/admin/chefs/${id}/verify`, { status }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getDisputes: () => api.get('/admin/disputes'),
  resolveDispute: (id, resolution) => api.patch(`/admin/disputes/${id}/resolve`, { resolution }),
  getCommission: () => api.get('/admin/commission'),
  updateCommission: (data) => api.post('/admin/commission', data),
  getRevenueReport: (params) => api.get('/admin/revenue-report', { params }),
  processRefund: (data) => api.post('/admin/refunds', data)
};
