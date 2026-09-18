import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTrips, deleteTrip } from '../../services/tripService'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import Button from '../../components/Button/Button'
import './MyTrips.css'

const STATUS_CONFIG = {
  draft:     { color: 'gray',   icon: '📝', label: 'Draft' },
  planned:   { color: 'blue',   icon: '📅', label: 'Planned' },
  active:    { color: 'green',  icon: '✈️', label: 'Active' },
  completed: { color: 'purple', icon: '✅', label: 'Completed' },
  cancelled: { color: 'red',    icon: '❌', label: 'Cancelled' },
}

function TripCard({ trip, onDelete }) {
  const days = trip.startDate && trip.endDate
    ? Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1)
    : 0

  const status = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft
  const r = trip.travelRequirements || {}

  return (
    <div className="mt-card" role="article" aria-label={trip.title}>
      <div className="mt-card__header">
        <div className="mt-card__destination-emoji" aria-hidden="true">🗺️</div>
        <span className={`mt-card__status mt-card__status--${status.color}`}>
          {status.icon} {status.label}
        </span>
      </div>

      <div className="mt-card__body">
        <h3 className="mt-card__title">
          <Link to={`/trips/${trip._id}`} className="mt-card__title-link">
            {trip.title}
          </Link>
        </h3>

        <p className="mt-card__dest">
          📍 {trip.destination?.name || '—'}, {trip.destination?.state || ''}
        </p>

        <div className="mt-card__dates">
          <span>📅 {new Date(trip.startDate).toLocaleDateString('en-IN')}</span>
          <span>→</span>
          <span>{new Date(trip.endDate).toLocaleDateString('en-IN')}</span>
          <span className="mt-card__days">({days}d)</span>
        </div>

        <div className="mt-card__meta">
          <span>👥 {trip.numberOfTravelers} traveler{trip.numberOfTravelers > 1 ? 's' : ''}</span>
          <span>🚶 {r.travelPace || 'moderate'} pace</span>
          {r.requiresWheelchair && <span title="Wheelchair">♿</span>}
        </div>
      </div>

      <div className="mt-card__footer">
        <Link to={`/trips/${trip._id}`} className="mt-card__view-btn" aria-label={`View ${trip.title}`}>
          View Itinerary →
        </Link>
        <button
          className="mt-card__delete-btn"
          onClick={() => onDelete(trip._id, trip.title)}
          aria-label={`Delete ${trip.title}`}
          id={`delete-trip-${trip._id}`}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

function MyTrips() {
  const navigate     = useNavigate()
  const [trips,   setTrips]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const load = () => {
    setLoading(true)
    getTrips()
      .then((res) => setTrips(res.data))
      .catch(() => setError('Failed to load trips.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return
    try {
      await deleteTrip(id)
      setTrips((prev) => prev.filter((t) => t._id !== id))
    } catch {
      setError('Failed to delete trip.')
    }
  }

  return (
    <main className="my-trips-page">
      <div className="container">
        <div className="mt-header animate-fade-in">
          <div>
            <h1 className="mt-title">My Trips</h1>
            <p className="mt-subtitle">
              {trips.length > 0 ? `${trips.length} trip${trips.length > 1 ? 's' : ''} planned` : 'Plan your first accessible trip'}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/trips/new')}
            id="new-trip-btn"
          >
            + New Trip
          </Button>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        {loading ? (
          <Loading message="Loading your trips..." />
        ) : trips.length === 0 ? (
          <div className="mt-empty" role="status">
            <span className="mt-empty__icon" aria-hidden="true">🗺️</span>
            <h2>No trips yet</h2>
            <p>Create your first accessible trip and get a personalized itinerary</p>
            <Button variant="primary" size="lg" onClick={() => navigate('/trips/new')} id="empty-new-trip-btn">
              Plan Your First Trip
            </Button>
          </div>
        ) : (
          <div className="mt-grid">
            {trips.map((trip) => (
              <TripCard key={trip._id} trip={trip} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default MyTrips
