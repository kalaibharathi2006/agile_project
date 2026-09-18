import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { login as loginApi, register as registerApi, getMe, logout as logoutApi } from '../services/authService'

/* ============================================================
   Auth State Shape
   ============================================================ */
const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  isLoading: true,   // true on first load while verifying token
  error: null,
}

/* ============================================================
   Reducer
   ============================================================ */
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null }

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'RESTORE_DONE':
      return { ...state, isLoading: false }

    default:
      return state
  }
}

/* ============================================================
   Context
   ============================================================ */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // On mount — if a token exists in localStorage, verify it with the server
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      dispatch({ type: 'RESTORE_DONE' })
      return
    }

    getMe()
      .then((data) => {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.user, token },
        })
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'RESTORE_DONE' })
      })
  }, [])

  /* ---- Actions ---- */
  const login = useCallback(async (credentials) => {
    dispatch({ type: 'AUTH_LOADING' })
    try {
      const data = await loginApi(credentials)
      localStorage.setItem('token', data.token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, token: data.token },
      })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.'
      dispatch({ type: 'AUTH_FAILURE', payload: message })
      return { success: false, error: message }
    }
  }, [])

  const register = useCallback(async (userData) => {
    dispatch({ type: 'AUTH_LOADING' })
    try {
      const data = await registerApi(userData)
      localStorage.setItem('token', data.token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, token: data.token },
      })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      dispatch({ type: 'AUTH_FAILURE', payload: message })
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(() => {
    logoutApi()
    dispatch({ type: 'LOGOUT' })
  }, [])

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ============================================================
   Hook
   ============================================================ */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
