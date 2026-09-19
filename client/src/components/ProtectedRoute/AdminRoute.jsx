import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Loading/Loading';

/**
 * Route guard that requires user to have 'admin' role.
 */
export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading message="Verifying administrative access..." fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <main className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '2.5rem',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          border: '1px solid #fee2e2'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛡️</span>
          <h1 style={{ fontSize: '1.5rem', color: '#991b1b', marginBottom: '0.75rem' }}>
            Administrator Access Required
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            This section is restricted to platform administrators. Your account (<strong>{user?.email}</strong>) is currently designated as a traveler.
          </p>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-block',
              background: '#0f172a',
              color: '#fff',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return children;
}
