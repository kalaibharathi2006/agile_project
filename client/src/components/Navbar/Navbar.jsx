import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../Button/Button'
import './Navbar.css'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="navbar" role="banner">
      <div className="navbar__inner container">
        {/* Brand */}
        <Link to="/" className="navbar__brand" aria-label="Inclusive Trip Designer - Home">
          <span className="navbar__logo" aria-hidden="true">🌍</span>
          <span className="navbar__brand-text">
            <span className="navbar__brand-title">Inclusive Trip</span>
            <span className="navbar__brand-sub">Designer</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav" aria-label="Main navigation">
          <Link
            to="/"
            className={`navbar__link ${isActive('/') ? 'navbar__link--active' : ''}`}
          >
            Home
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`navbar__link ${isActive('/dashboard') ? 'navbar__link--active' : ''}`}
            >
              Dashboard
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/profile"
              className={`navbar__link ${isActive('/profile') ? 'navbar__link--active' : ''}`}
            >
              Profile
            </Link>
          )}
        </nav>

        {/* Desktop Auth */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <>
              <span className="navbar__user">
                <span className="navbar__user-avatar" aria-hidden="true">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                <span className="navbar__user-name">{user?.name?.split(' ')[0]}</span>
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className={`navbar__toggle ${menuOpen ? 'navbar__toggle--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div id="mobile-menu" className="navbar__mobile" aria-label="Mobile navigation">
          <nav className="navbar__mobile-nav">
            <Link
              to="/"
              className="navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              🏠 Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                📊 Dashboard
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/profile"
                className="navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                👤 Profile
              </Link>
            )}
            <div className="navbar__mobile-divider" />
            {isAuthenticated ? (
              <>
                <div className="navbar__mobile-user">
                  Logged in as <strong>{user?.name}</strong>
                </div>
                <button className="navbar__mobile-link navbar__mobile-link--danger" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>
                  🔑 Login
                </Link>
                <Link to="/register" className="navbar__mobile-link navbar__mobile-link--primary" onClick={() => setMenuOpen(false)}>
                  ✨ Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar
