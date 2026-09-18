/**
 * scoringService.js  —  Phase 6: Frontend API calls for scoring
 */

import api from './api'

/**
 * GET /api/scoring/trip/:id
 * Returns full accessibility & comfort score breakdown for a trip.
 * Requires auth token.
 */
export const getTripScores = async (tripId) => {
  const response = await api.get(`/scoring/trip/${tripId}`)
  return response.data
}

/**
 * GET /api/scoring/destination/:id
 * Returns destination grade + attraction stats. Public.
 */
export const getDestinationScores = async (destinationId) => {
  const response = await api.get(`/scoring/destination/${destinationId}`)
  return response.data
}

/**
 * GET /api/scoring/attraction/:id
 * Returns full sub-score breakdown for one attraction. Public.
 */
export const getAttractionScores = async (attractionId) => {
  const response = await api.get(`/scoring/attraction/${attractionId}`)
  return response.data
}
