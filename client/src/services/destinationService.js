import api from './api'

/**
 * GET /api/destinations
 * @param {object} params - { search, state, wheelchairFriendly, page, limit }
 */
export const getDestinations = async (params = {}) => {
  const response = await api.get('/destinations', { params })
  return response.data
}

/**
 * GET /api/destinations/:id
 */
export const getDestination = async (id) => {
  const response = await api.get(`/destinations/${id}`)
  return response.data
}

/**
 * GET /api/attractions
 * @param {object} params - { destination, category, wheelchairAccessible,
 *                            elevatorAvailable, accessibleRestroom,
 *                            walkingDifficulty, search, page, limit }
 */
export const getAttractions = async (params = {}) => {
  const response = await api.get('/attractions', { params })
  return response.data
}

/**
 * GET /api/attractions/:id
 */
export const getAttraction = async (id) => {
  const response = await api.get(`/attractions/${id}`)
  return response.data
}
