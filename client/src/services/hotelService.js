import api from './api'

/**
 * GET /api/hotels
 * @param {object} params - { destination, search, priceCategory, starRating,
 *                            wheelchairAccessible, elevatorAvailable, accessibleRooms,
 *                            accessibleRestroom, rampAccess, parkingAvailable,
 *                            accessiblePool, visualAlerts, sort, page, limit }
 */
export const getHotels = async (params = {}) => {
  const response = await api.get('/hotels', { params })
  return response.data
}

/**
 * GET /api/hotels/:id
 */
export const getHotel = async (id) => {
  const response = await api.get(`/hotels/${id}`)
  return response.data
}

/**
 * GET /api/hotels/recommendations
 * @param {object} params - { destination, tripId, requiresWheelchair, requiresElevator, requiresAccessibleRestroom }
 */
export const getHotelRecommendations = async (params = {}) => {
  const response = await api.get('/hotels/recommendations', { params })
  return response.data
}
