import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../../components/Button/Button'
import { getTrips } from '../../services/tripService'
import { getReviews } from '../../services/reviewService'
import './Dashboard.css'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [tripCount, setTripCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    getTrips()
      .then((res) => setTripCount(res.count || (res.data ? res.data.length : 0)))
      .catch(() => {})

    getReviews()
      .then((res) => {
        const myReviews = (res.data || []).filter((r) => r.user?._id === user?._id)
        setReviewCount(myReviews.length)
      })
      .catch(() => {})
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const quickActions = [
    { id: 'plan-trip-btn',     icon: '🗺️', title: 'Plan a Trip',          desc: 'Create a new accessible itinerary',     path: '/trips/new' },
    { id: 'browse-dest-btn',   icon: '🏛️', title: 'Explore Destinations',  desc: 'Browse accessible Indian destinations', path: '/destinations' },
    { id: 'find-hotels-btn',   icon: '🏨', title: 'Find Hotels',           desc: 'Discover wheelchair-friendly stays',    path: '/hotels' },
    { id: 'my-trips-btn',      icon: '📋', title: 'My Trips',              desc: 'View and manage your trips',           path: '/trips' },
    { id: 'edit-profile-btn',  icon: '👤', title: 'Edit Profile',          desc: 'Update accessibility preferences',     path: '/profile' },
    { id: 'write-review-btn',  icon: '⭐', title: 'Write a Review',        desc: 'Share verified accessibility feedback', path: '/destinations' },
  ]

  if (user?.role === 'admin') {
    quickActions.unshift({
      id: 'admin-portal-btn',
      icon: '🛡️',
      title: 'Admin Portal',
      desc: 'Manage users, content, reviews & analytics',
      path: '/admin',
      isAdmin: true,
    })
  }

  const stats = [
    { icon: '🗺️', value: tripCount, label: 'Trips Planned' },
    { icon: '🏛️', value: '8', label: 'Destinations Available' },
    { icon: '🏨', value: '6', label: 'Partner Hotels' },
    { icon: '⭐', value: reviewCount, label: 'Reviews Written' },
  ]

  return (
    <main className="dashboard">
      <div className="container">
        {/* Welcome Banner */}
        <section className="dashboard__welcome animate-fade-in" aria-labelledby="dashboard-greeting">
          <div className="dashboard__welcome-content">
            <div className="dashboard__avatar" aria-hidden="true">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="dashboard__greeting">{greeting()},</p>
              <h1 id="dashboard-greeting" className="dashboard__name">
                {user?.name} 👋
              </h1>
              <p className="dashboard__role">
                {user?.role === 'admin' ? '🛡️ Platform Administrator' : '🌍 Traveler'}
                {user?.email && (
                  <span className="dashboard__email"> · {user.email}</span>
                )}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {user?.role === 'admin' && (
              <Button size="sm" onClick={() => navigate('/admin')}>
                Admin Portal ↗
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} id="dashboard-logout-btn">
              Logout
            </Button>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="dashboard__section" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="dashboard__section-title">
            Quick Actions
          </h2>
          <div className="dashboard__actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.id}
                id={action.id}
                className={`dashboard__action-card ${action.isAdmin ? 'dashboard__action-card--admin' : ''}`}
                aria-label={action.title}
                onClick={() => action.path ? navigate(action.path) : {}}
              >
                <span className="dashboard__action-icon" aria-hidden="true">
                  {action.icon}
                </span>
                <span className="dashboard__action-title">{action.title}</span>
                <span className="dashboard__action-desc">{action.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Stats Overview */}
        <section className="dashboard__section" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="dashboard__section-title">
            Your Journey Stats
          </h2>
          <div className="dashboard__stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="dashboard__stat-card">
                <span className="dashboard__stat-icon" aria-hidden="true">{stat.icon}</span>
                <div>
                  <p className="dashboard__stat-value">{stat.value}</p>
                  <p className="dashboard__stat-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
