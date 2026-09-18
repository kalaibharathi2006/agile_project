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

/** POST /api/trips/:id/itinerary/item — add new stop/break */
export const addItineraryItem = async (tripId, itemData) => {
  const response = await api.post(`/trips/${tripId}/itinerary/item`, itemData)
  return response.data
}

/** PUT /api/trips/:id/itinerary/item/:itemId — modify stop/break */
export const modifyItineraryItem = async (tripId, itemId, itemData) => {
  const response = await api.put(`/trips/${tripId}/itinerary/item/${itemId}`, itemData)
  return response.data
}

/** DELETE /api/trips/:id/itinerary/item/:itemId — delete stop */
export const deleteItineraryItem = async (tripId, itemId) => {
  const response = await api.delete(`/trips/${tripId}/itinerary/item/${itemId}`)
  return response.data
}

/** POST /api/trips/:id/itinerary/adapt — smart adaptation & re-scoring */
export const adaptItinerary = async (tripId) => {
  const response = await api.post(`/trips/${tripId}/itinerary/adapt`)
  return response.data
}


