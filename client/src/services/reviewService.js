import api from './api';

/**
 * Get reviews with optional filters (entityType, entityId, rating, isVerified, wheelchairAccessible, page, limit, sort)
 */
export const getReviews = async (params = {}) => {
  const response = await api.get('/reviews', { params });
  return response.data;
};

/**
 * Create or update a review
 */
export const createReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

/**
 * Toggle helpful vote on a review
 */
export const voteHelpful = async (reviewId) => {
  const response = await api.post(`/reviews/${reviewId}/helpful`);
  return response.data;
};

/**
 * Verify or unverify review (Admin only)
 */
export const verifyReview = async (reviewId, isVerified = true) => {
  const response = await api.put(`/reviews/${reviewId}/verify`, { isVerified });
  return response.data;
};

/**
 * Delete a review (owner or admin)
 */
export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};
