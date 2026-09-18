import api from './api'

/** POST /api/trips */
export const createTrip = async (data) => {
  const response = await api.post('/trips', data)
  return response.data
}

/** GET /api/trips */
export const getTrips = async () => {
  const response = await api.get('/trips')
  return response.data
}

/** GET /api/trips/:id */
export const getTrip = async (id) => {
  const response = await api.get(`/trips/${id}`)
  return response.data
}

/** PUT /api/trips/:id */
export const updateTrip = async (id, data) => {
  const response = await api.put(`/trips/${id}`, data)
  return response.data
}

/** DELETE /api/trips/:id */
export const deleteTrip = async (id) => {
  const response = await api.delete(`/trips/${id}`)
  return response.data
}

/** POST /api/trips/:id/itinerary — generate itinerary */
export const generateItinerary = async (tripId) => {
  const response = await api.post(`/trips/${tripId}/itinerary`)
  return response.data
}

/** GET /api/trips/:id/itinerary */
export const getItinerary = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/itinerary`)
  return response.data
}

/** PUT /api/trips/:id/itinerary */
export const updateItinerary = async (tripId, data) => {
  const response = await api.put(`/trips/${tripId}/itinerary`, data)
  return response.data
}

/** PUT /api/trips/:id/hotel — assign or remove hotel */
export const assignHotelToTrip = async (tripId, hotelId) => {
  const response = await api.put(`/trips/${tripId}/hotel`, { hotelId })
  return response.data
}

