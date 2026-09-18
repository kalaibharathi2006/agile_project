import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getHotel } from '../../services/hotelService'
import { getTrips, assignHotelToTrip } from '../../services/tripService'
import { useAuth } from '../../context/AuthContext'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import Button from '../../components/Button/Button'
import { ScorePill } from '../../components/AccessibilityBadge/AccessibilityBadge'
import './HotelDetail.css'

function HotelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [hotel, setHotel]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // Assign to trip modal state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [userTrips, setUserTrips]             = useState([])
  const [selectedTripId, setSelectedTripId]   = useState('')
  const [assigning, setAssigning]             = useState(false)
  const [assignSuccess, setAssignSuccess]     = useState('')
  const [assignError, setAssignError]         = useState('')

  useEffect(() => {
    setLoading(true)
    getHotel(id)
      .then((res) => setHotel(res.data))
      .catch(() => setError('Hotel not found or currently unavailable.'))
      .finally(() => setLoading(false))
  }, [id])

  // Load user trips when opening the assign modal
  const handleOpenAssign = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setShowAssignModal(true)
    setAssignSuccess('')
    setAssignError('')
    try {
      const res = await getTrips()
      const trips = res.data || []
      setUserTrips(trips)
      if (trips.length > 0) {
        // Default to a trip matching the destination if available
        const matchingTrip = trips.find(
          (t) => t.destination?._id === hotel?.destination?._id || t.destination === hotel?.destination?._id
        )
        setSelectedTripId(matchingTrip ? matchingTrip._id : trips[0]._id)
      }
    } catch {
      setAssignError('Failed to load trips.')
    }
  }

  const handleConfirmAssign = async () => {
    if (!selectedTripId) return
    setAssigning(true)
    setAssignError('')
    try {
      await assignHotelToTrip(selectedTripId, hotel._id)
      setAssignSuccess('Hotel successfully added to your trip!')
      setTimeout(() => {
        setShowAssignModal(false)
        navigate(`/trips/${selectedTripId}`)
      }, 1200)
    } catch {
      setAssignError('Could not assign hotel to this trip. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <main className="hotel-detail-page">
        <Loading message="Loading hotel accessibility details…" />
      </main>
    )
  }

  if (error || !hotel) {
    return (
      <main className="hotel-detail-page container">
        <ErrorMessage message={error || 'Hotel not found'} />
        <Link to="/hotels" className="hd-back-link">← Back to Hotels</Link>
      </main>
    )
  }

  const a = hotel.accessibility || {}

  const a11yFeatures = [
    { label: 'Wheelchair Accessible Entrance', value: a.wheelchairAccessible, icon: '♿' },
    { label: 'Elevator / Lift to All Floors',   value: a.elevatorAvailable,    icon: '🛗' },
    { label: 'Dedicated Accessible Guest Rooms',value: a.accessibleRooms,      icon: '🛏️' },
    { label: 'Roll-in Shower / Accessible Bath',value: a.accessibleRestroom,   icon: '🚻' },
    { label: 'Step-Free Ramp Access',          value: a.rampAccess,           icon: '🛹' },
    { label: 'Designated Accessible Parking',   value: a.parkingAvailable,     icon: '🅿️' },
    { label: 'Accessible Swimming Pool',        value: a.accessiblePool,       icon: '🏊' },
    { label: 'Visual & Audible Emergency Alerts',value: a.visualAlerts,       icon: '🚨' },
  ]

  return (
    <main className="hotel-detail-page" id="main-content">
      {/* Breadcrumbs */}
      <div className="container hd-breadcrumbs">
        <Link to="/hotels">Hotels</Link>
        <span aria-hidden="true">›</span>
        {hotel.destination?.name && (
          <>
            <Link to={`/destinations/${hotel.destination._id}`}>{hotel.destination.name}</Link>
            <span aria-hidden="true">›</span>
          </>
        )}
        <span className="hd-breadcrumbs__current">{hotel.name}</span>
      </div>

      {/* Hero Header */}
      <section className="hd-hero">
        <div className="container hd-hero__inner">
          <div className="hd-hero__content">
            <div className="hd-hero__meta">
              <span className="hd-stars">{'⭐'.repeat(hotel.starRating || 3)}</span>
              <span className={`hd-category hd-category--${hotel.priceCategory}`}>
                {hotel.priceCategory}
              </span>
              {hotel.rating > 0 && (
                <span className="hd-rating-badge">
                  ★ {hotel.rating} / 5 ({hotel.reviewCount || 0} reviews)
                </span>
              )}
            </div>

            <h1 className="hd-title">{hotel.name}</h1>
            <p className="hd-address">
              📍 {hotel.address || (hotel.destination?.name ? `${hotel.destination.name}, ${hotel.destination.state}` : 'India')}
            </p>

            <div className="hd-hero__actions">
              <div className="hd-price-box">
                <span className="hd-price">₹{(hotel.pricePerNight || 0).toLocaleString('en-IN')}</span>
                <span className="hd-price-label">per night (est.)</span>
              </div>
              <Button size="lg" onClick={handleOpenAssign}>
                Add to My Trip
              </Button>
            </div>
          </div>

          <div className="hd-hero__score-card">
            <div className="hd-score-badge">
              <span className="hd-score-val">{a.accessibilityScore || 7}</span>
              <span className="hd-score-max">/10</span>
            </div>
            <p className="hd-score-title">Accessibility Rating</p>
            <p className="hd-score-desc">
              {(a.accessibilityScore || 7) >= 9
                ? 'Excellent: Universal barrier-free design.'
                : (a.accessibilityScore || 7) >= 7
                ? 'High: Strong accessibility support with key facilities.'
                : 'Moderate: Basic accessibility features present.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="container hd-grid">
        <div className="hd-main">
          {/* Overview */}
          <section className="hd-card" aria-labelledby="about-heading">
            <h2 id="about-heading" className="hd-card__title">🏨 About this Property</h2>
            <p className="hd-desc">{hotel.description || 'Comfortable and welcoming accommodation.'}</p>
          </section>

          {/* Accessibility Breakdown */}
          <section className="hd-card" aria-labelledby="a11y-heading">
            <div className="hd-card__header-row">
              <h2 id="a11y-heading" className="hd-card__title">♿ Accessibility Facilities</h2>
              <span className="hd-verified-pill">✓ Verified Features</span>
            </div>

            {a.accessibilityNotes && (
              <div className="hd-a11y-notes" role="note">
                <span aria-hidden="true">💡</span>
                <p><strong>Property Accessibility Note:</strong> {a.accessibilityNotes}</p>
              </div>
            )}

            <div className="hd-features-grid">
              {a11yFeatures.map((f, idx) => (
                <div key={idx} className={`hd-feature-item ${f.value ? 'hd-feature-item--yes' : 'hd-feature-item--no'}`}>
                  <span className="hd-feature-icon" aria-hidden="true">{f.icon}</span>
                  <div className="hd-feature-text">
                    <span className="hd-feature-label">{f.label}</span>
                    <span className="hd-feature-status">
                      {f.value ? '✓ Available' : '— Not available / unverified'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Amenities */}
          {hotel.amenities?.length > 0 && (
            <section className="hd-card" aria-labelledby="amenities-heading">
              <h2 id="amenities-heading" className="hd-card__title">✨ Hotel Amenities</h2>
              <div className="hd-amenities-list">
                {hotel.amenities.map((item, idx) => (
                  <span key={idx} className="hd-amenity-chip">✓ {item}</span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hd-sidebar">
          {/* Quick Details Card */}
          <div className="hd-card">
            <h3 className="hd-card__subtitle">📋 Key Information</h3>
            <ul className="hd-details-list">
              <li>
                <span className="hd-detail-label">Check-in:</span>
                <span className="hd-detail-val">{hotel.checkInTime || '14:00'}</span>
              </li>
              <li>
                <span className="hd-detail-label">Check-out:</span>
                <span className="hd-detail-val">{hotel.checkOutTime || '12:00'}</span>
              </li>
              <li>
                <span className="hd-detail-label">Price Category:</span>
                <span className="hd-detail-val text-capitalize">{hotel.priceCategory}</span>
              </li>
              {hotel.phone && (
                <li>
                  <span className="hd-detail-label">Phone:</span>
                  <a href={`tel:${hotel.phone}`} className="hd-detail-link">{hotel.phone}</a>
                </li>
              )}
              {hotel.website && (
                <li>
                  <span className="hd-detail-label">Website:</span>
                  <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="hd-detail-link">Visit Website ↗</a>
                </li>
              )}
            </ul>

            <Button
              className="hd-sidebar-btn"
              onClick={handleOpenAssign}
            >
              Add this Hotel to Trip
            </Button>
          </div>
        </aside>
      </div>

      {/* Assign to Trip Modal */}
      {showAssignModal && (
        <div className="hd-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="hd-modal">
            <button
              className="hd-modal-close"
              onClick={() => setShowAssignModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h3 id="modal-title" className="hd-modal__title">Add Hotel to Trip</h3>
            <p className="hd-modal__sub">
              Select an upcoming trip to associate <strong>{hotel.name}</strong> as your accommodation.
            </p>

            {assignSuccess && (
              <div className="hd-alert hd-alert--success" role="alert">
                {assignSuccess} Redirecting to trip…
              </div>
            )}

            {assignError && (
              <div className="hd-alert hd-alert--danger" role="alert">
                {assignError}
              </div>
            )}

            {userTrips.length === 0 ? (
              <div className="hd-no-trips">
                <p>You have no active trips yet.</p>
                <Link to="/trips/new">
                  <Button size="sm">Create a New Trip</Button>
                </Link>
              </div>
            ) : (
              <div className="hd-trip-select-group">
                <label htmlFor="trip-select" className="hd-trip-label">Choose Trip:</label>
                <select
                  id="trip-select"
                  className="hd-trip-select"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  disabled={assigning || !!assignSuccess}
                >
                  {userTrips.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.destination?.name || 'Trip'} — {new Date(t.startDate).toLocaleDateString('en-IN')})
                    </option>
                  ))}
                </select>

                <div className="hd-modal-actions">
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignModal(false)}
                    disabled={assigning}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmAssign}
                    disabled={assigning || !selectedTripId || !!assignSuccess}
                  >
                    {assigning ? 'Adding…' : 'Confirm & Save'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default HotelDetail
