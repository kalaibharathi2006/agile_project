import api from './api'

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  return response.data
}

/**
 * Login with email and password
 * POST /api/auth/login
 */
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials)
  return response.data
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getMe = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

/**
 * Logout — clears local storage
 */
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
