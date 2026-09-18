import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loading from '../Loading/Loading'

/**
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to /login,
 * preserving the attempted URL in location state.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // While verifying token on first load — show spinner
  if (isLoading) {
    return <Loading message="Verifying your session..." fullPage />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
