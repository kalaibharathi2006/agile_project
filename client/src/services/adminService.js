import api from './api';

// ── Analytics ──
export const getAnalyticsOverview = async () => {
  const res = await api.get('/admin/analytics/overview');
  return res.data;
};

export const getAccessibilityReports = async () => {
  const res = await api.get('/admin/analytics/accessibility');
  return res.data;
};

// ── Users ──
export const getAdminUsers = async (params = {}) => {
  const res = await api.get('/admin/users', { params });
  return res.data;
};

export const updateUserRole = async (userId, role) => {
  const res = await api.put(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const toggleUserStatus = async (userId) => {
  const res = await api.put(`/admin/users/${userId}/status`);
  return res.data;
};

export const deleteUser = async (userId) => {
  const res = await api.delete(`/admin/users/${userId}`);
  return res.data;
};

// ── Destinations ──
export const getAdminDestinations = async () => {
  const res = await api.get('/admin/destinations');
  return res.data;
};

export const createDestination = async (data) => {
  const res = await api.post('/admin/destinations', data);
  return res.data;
};

export const updateDestination = async (id, data) => {
  const res = await api.put(`/admin/destinations/${id}`, data);
  return res.data;
};

export const deleteDestination = async (id) => {
  const res = await api.delete(`/admin/destinations/${id}`);
  return res.data;
};

// ── Attractions ──
export const getAdminAttractions = async () => {
  const res = await api.get('/admin/attractions');
  return res.data;
};

export const createAttraction = async (data) => {
  const res = await api.post('/admin/attractions', data);
  return res.data;
};

export const updateAttraction = async (id, data) => {
  const res = await api.put(`/admin/attractions/${id}`, data);
  return res.data;
};

export const deleteAttraction = async (id) => {
  const res = await api.delete(`/admin/attractions/${id}`);
  return res.data;
};

// ── Hotels ──
export const getAdminHotels = async () => {
  const res = await api.get('/admin/hotels');
  return res.data;
};

export const createHotel = async (data) => {
  const res = await api.post('/admin/hotels', data);
  return res.data;
};

export const updateHotel = async (id, data) => {
  const res = await api.put(`/admin/hotels/${id}`, data);
  return res.data;
};

export const deleteHotel = async (id) => {
  const res = await api.delete(`/admin/hotels/${id}`);
  return res.data;
};

// ── Reviews & Verification ──
export const getAdminReviews = async (params = {}) => {
  const res = await api.get('/admin/reviews', { params });
  return res.data;
};

export const verifyReviewAdmin = async (id, isVerified = true) => {
  const res = await api.put(`/admin/reviews/${id}/verify`, { isVerified });
  return res.data;
};

export const deleteReviewAdmin = async (id) => {
  const res = await api.delete(`/admin/reviews/${id}`);
  return res.data;
};

// ── Partners ──
export const getAdminPartners = async (params = {}) => {
  const res = await api.get('/admin/partners', { params });
  return res.data;
};

export const createPartner = async (data) => {
  const res = await api.post('/admin/partners', data);
  return res.data;
};

export const updatePartner = async (id, data) => {
  const res = await api.put(`/admin/partners/${id}`, data);
  return res.data;
};

export const deletePartner = async (id) => {
  const res = await api.delete(`/admin/partners/${id}`);
  return res.data;
};

// ── Trips ──
export const getAdminTrips = async () => {
  const res = await api.get('/admin/trips');
  return res.data;
};
