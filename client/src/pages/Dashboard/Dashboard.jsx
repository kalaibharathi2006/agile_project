import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button/Button'
import './Dashboard.css'


function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
                {user?.role === 'admin' ? '🔐 Administrator' : '🌍 Traveler'}
                {user?.email && (
                  <span className="dashboard__email"> · {user.email}</span>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} id="dashboard-logout-btn">
            Logout
          </Button>
        </section>

        {/* Quick Actions */}
        <section className="dashboard__section" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="dashboard__section-title">
            Quick Actions
          </h2>
          <div className="dashboard__actions-grid">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                id={action.id}
                className="dashboard__action-card"
                aria-label={action.title}
                onClick={() => action.path ? navigate(action.path) : {}}
              >
                <span className="dashboard__action-icon" aria-hidden="true">
                  {action.icon}
                </span>
                <span className="dashboard__action-title">{action.title}</span>
                <span className="dashboard__action-desc">{action.desc}</span>
                <span className="dashboard__action-badge">Coming soon</span>
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
            {STATS.map((stat) => (
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

        {/* Phase Progress — Development indicator */}
        <section className="dashboard__section dashboard__phase-banner" aria-labelledby="phase-heading">
          <h2 id="phase-heading" className="dashboard__phase-title">
            🚧 Development Progress
          </h2>
          <p className="dashboard__phase-text">
            Phase 2 complete — Authentication is working! More features are being added phase by phase.
          </p>
          <div className="dashboard__phases">
            {PHASES.map((p) => (
              <div key={p.name} className={`dashboard__phase-item dashboard__phase-item--${p.status}`}>
                <span className="dashboard__phase-check" aria-hidden="true">
                  {p.status === 'done' ? '✅' : p.status === 'current' ? '🔵' : '⚪'}
                </span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

const QUICK_ACTIONS = [
  { id: 'plan-trip-btn',     icon: '🗺️', title: 'Plan a Trip',         desc: 'Create a new accessible itinerary',     path: null },
  { id: 'browse-dest-btn',   icon: '🏛️', title: 'Explore Destinations', desc: 'Browse accessible Indian destinations', path: null },
  { id: 'find-hotels-btn',   icon: '🏨', title: 'Find Hotels',          desc: 'Discover wheelchair-friendly stays',    path: null },
  { id: 'my-trips-btn',      icon: '📋', title: 'My Trips',             desc: 'View and manage your trips',           path: null },
  { id: 'edit-profile-btn',  icon: '👤', title: 'Edit Profile',         desc: 'Update accessibility preferences',     path: '/profile' },
  { id: 'write-review-btn',  icon: '⭐', title: 'Write a Review',       desc: 'Share your accessibility experience',  path: null },
]

const STATS = [
  { icon: '🗺️', value: '0', label: 'Trips Planned' },
  { icon: '🏛️', value: '8', label: 'Destinations Available' },
  { icon: '🏨', value: '6', label: 'Partner Hotels' },
  { icon: '⭐', value: '0', label: 'Reviews Written' },
]

const PHASES = [
  { name: 'Phase 1 — Backend Foundation',  status: 'done'    },
  { name: 'Phase 2 — Authentication',      status: 'current' },
  { name: 'Phase 3 — Profile & Preferences', status: 'upcoming' },
  { name: 'Phase 4 — Destination Discovery', status: 'upcoming' },
  { name: 'Phase 5 — Trip Planner',        status: 'upcoming' },
]

export default Dashboard
