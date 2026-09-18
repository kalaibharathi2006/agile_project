import api from './api'

/**
 * GET /api/profile
 */
export const getProfile = async () => {
  const response = await api.get('/profile')
  return response.data
}

/**
 * PUT /api/profile
 * @param {object} data - { name, phone, dateOfBirth, avatar }
 */
export const updateProfile = async (data) => {
  const response = await api.put('/profile', data)
  return response.data
}

/**
 * GET /api/profile/preferences
 */
export const getPreferences = async () => {
  const response = await api.get('/profile/preferences')
  return response.data
}

/**
 * PUT /api/profile/preferences
 * @param {object} data - accessibility preference fields
 */
export const updatePreferences = async (data) => {
  const response = await api.put('/profile/preferences', data)
  return response.data
}
