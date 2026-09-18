import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  getTrip,
  getItinerary,
  generateItinerary,
  deleteTrip,
  updateTrip,
  assignHotelToTrip,
  addItineraryItem,
  modifyItineraryItem,
  deleteItineraryItem,
  adaptItinerary,
} from '../../services/tripService'
import { getTripScores } from '../../services/scoringService'
import { getAttractions } from '../../services/destinationService'
import { TripScoreCard } from '../../components/AccessibilityScoreCard/AccessibilityScoreCard'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import Button from '../../components/Button/Button'
import EditTripModal from './EditTripModal'
import EditItemModal from './EditItemModal'
import './TripDetail.css'

// Lazy-load map to avoid SSR issues with Leaflet
const TripMap = lazy(() => import('../../components/Map/TripMap').then(m => ({ default: m.TripMap })))

/* ─── Item type config ─── */
const TYPE_CONFIG = {
  attraction: { icon: '🏛️', color: 'blue',   label: 'Attraction' },
  meal:       { icon: '🍽️', color: 'orange', label: 'Meal Break' },
  rest:       { icon: '💺', color: 'green',  label: 'Rest Break' },
  hotel:      { icon: '🏨', color: 'purple', label: 'Hotel' },
  transport:  { icon: '🚌', color: 'teal',   label: 'Transport'  },
  free:       { icon: '🌟', color: 'gray',   label: 'Free Time'  },
}

/* ─── Single itinerary item ─── */
function ItineraryItem({ item, onEdit, onDelete }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.free
  return (
    <div className={`ti-item ti-item--${config.color}`} role="listitem">
      <div className="ti-item__time-col">
        <span className="ti-item__start">{item.startTime}</span>
        <div className="ti-item__line" aria-hidden="true" />
        <span className="ti-item__end">{item.endTime}</span>
      </div>

      <div className="ti-item__dot" aria-hidden="true">{config.icon}</div>

      <div className="ti-item__body">
        <div className="ti-item__header">
          <h4 className="ti-item__title">{item.title}</h4>
          <span className={`ti-item__badge ti-item__badge--${config.color}`}>{config.label}</span>
        </div>

        {item.description && <p className="ti-item__desc">{item.description}</p>}

        <div className="ti-item__meta">
          <span>⏱️ {item.durationMinutes} min</span>
          {item.distanceFromPreviousMeters > 0 && (
            <span>📏 {item.distanceFromPreviousMeters}m from prev</span>
          )}
          {item.transportMode && item.transportMode !== 'none' && (
            <span>🚗 {item.transportMode}</span>
          )}
        </div>

        {item.accessibilityNotes && (
          <p className="ti-item__a11y-note">♿ {item.accessibilityNotes}</p>
        )}
      </div>

      {/* Phase 9: Item quick actions */}
      <div className="ti-item__actions">
        <button
          type="button"
          className="ti-item__action-btn"
          onClick={() => onEdit(item)}
          title="Edit stop timing / transport"
          aria-label={`Edit ${item.title}`}
        >
          ✏️
        </button>
        <button
          type="button"
          className="ti-item__action-btn ti-item__action-btn--delete"
          onClick={() => onDelete(item._id)}
          title="Remove from itinerary"
          aria-label={`Remove ${item.title}`}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

/* ─── Day section ─── */
function DaySection({ day, items, tripStartDate, onEditItem, onDeleteItem, onAddItem }) {
  const date = tripStartDate
    ? new Date(new Date(tripStartDate).getTime() + (day - 1) * 86400000)
        .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : `Day ${day}`

  const attractions = items.filter((i) => i.type === 'attraction').length
  const meals       = items.filter((i) => i.isMealBreak).length
  const rests       = items.filter((i) => i.isRestBreak).length

  return (
    <section className="ti-day" aria-labelledby={`day-${day}-heading`}>
      <div className="ti-day__header">
        <div>
          <h3 id={`day-${day}-heading`} className="ti-day__title">Day {day}</h3>
          <p className="ti-day__date">{date}</p>
        </div>
        <div className="ti-day__header-right">
          <div className="ti-day__stats">
            {attractions > 0 && <span>🏛️ {attractions} attractions</span>}
            {meals > 0       && <span>🍽️ {meals} meals</span>}
            {rests > 0       && <span>💺 {rests} rests</span>}
          </div>
          <button
            type="button"
            className="ti-day__add-btn"
            onClick={() => onAddItem(day)}
            aria-label={`Add stop to Day ${day}`}
          >
            ➕ Add Stop
          </button>
        </div>
      </div>
      <div className="ti-day__items" role="list" aria-label={`Day ${day} itinerary`}>
        {items.map((item, idx) => (
          <ItineraryItem
            key={item._id || idx}
            item={item}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
    </section>
  )
}

/* ─── Trip summary card ─── */
function TripSummary({ trip }) {
  const days = trip.startDate && trip.endDate
    ? Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 86400000) + 1)
    : 0

  const r = trip.travelRequirements || {}

  return (
    <aside className="td-summary" aria-labelledby="trip-summary-heading">
      <h2 id="trip-summary-heading" className="td-summary__title">Trip Summary</h2>

      <div className="td-summary__grid">
        <SummaryItem icon="🏛️" label="Destination"  value={trip.destination?.name || '—'} />
        <SummaryItem icon="📅" label="Start Date"   value={new Date(trip.startDate).toLocaleDateString('en-IN')} />
        <SummaryItem icon="📅" label="End Date"     value={new Date(trip.endDate).toLocaleDateString('en-IN')} />
        <SummaryItem icon="🗓️" label="Duration"     value={`${days} day${days !== 1 ? 's' : ''}`} />
        <SummaryItem icon="👥" label="Travelers"    value={`${trip.numberOfTravelers} person${trip.numberOfTravelers > 1 ? 's' : ''}`} />
        <SummaryItem icon="🚶" label="Travel Pace"  value={r.travelPace || 'moderate'} />
      </div>

      <div className="td-summary__a11y">
        <h3 className="td-summary__a11y-title">♿ Requirements</h3>
        <div className="td-summary__badges">
          {r.requiresWheelchair        && <span className="td-req-badge">♿ Wheelchair</span>}
          {r.requiresElevator          && <span className="td-req-badge">🛗 Elevator</span>}
          {r.requiresAccessibleRestroom && <span className="td-req-badge">🚻 Restroom</span>}
          {r.requiresSeatingRest       && <span className="td-req-badge">💺 Seating</span>}
          {!r.requiresWheelchair && !r.requiresElevator && !r.requiresAccessibleRestroom && !r.requiresSeatingRest && (
            <span className="td-req-badge td-req-badge--none">No special requirements</span>
          )}
        </div>
      </div>

      <div className="td-summary__status">
        <span className={`td-status td-status--${trip.status}`}>{trip.status}</span>
      </div>
    </aside>
  )
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="td-summary__item">
      <span aria-hidden="true">{icon}</span>
      <div>
        <p className="td-summary__label">{label}</p>
        <p className="td-summary__value">{value}</p>
      </div>
    </div>
  )
}

/* ─── Phase 8: Trip Hotel accommodation card ─── */
function TripHotelCard({ trip, onRemoveHotel }) {
  const hotel = trip.hotel
  const destId = trip.destination?._id || trip.destination

  return (
    <aside className="td-hotel-card" aria-labelledby="hotel-card-heading">
      <div className="td-hotel-card__header">
        <h2 id="hotel-card-heading" className="td-hotel-card__title">🏨 Accommodation</h2>
        {hotel && (
          <Link to={`/hotels/${hotel._id}`} className="td-hotel-link">View Details</Link>
        )}
      </div>

      {hotel ? (
        <div className="td-hotel-content">
          <div className="td-hotel-info">
            <h3 className="td-hotel-name">
              <Link to={`/hotels/${hotel._id}`}>{hotel.name}</Link>
            </h3>
            <p className="td-hotel-rating">
              {'⭐'.repeat(hotel.starRating || 3)}
              {hotel.priceCategory && <span className={`td-hotel-cat td-hotel-cat--${hotel.priceCategory}`}>{hotel.priceCategory}</span>}
            </p>
            {hotel.address && <p className="td-hotel-address">📍 {hotel.address}</p>}
            {hotel.pricePerNight > 0 && (
              <p className="td-hotel-price">
                ₹{hotel.pricePerNight.toLocaleString('en-IN')} <small>/ night</small>
              </p>
            )}
          </div>

          {/* Quick a11y badges */}
          {hotel.accessibility && (
            <div className="td-hotel-a11y">
              {hotel.accessibility.wheelchairAccessible && <span className="td-badge-pill">♿ Wheelchair</span>}
              {hotel.accessibility.elevatorAvailable    && <span className="td-badge-pill">🛗 Elevator</span>}
              {hotel.accessibility.accessibleRooms      && <span className="td-badge-pill">🛏️ Rooms</span>}
              {hotel.accessibility.accessibleRestroom   && <span className="td-badge-pill">🚻 Bath</span>}
            </div>
          )}

          <div className="td-hotel-actions">
            <Link to={`/hotels?destination=${destId}`}>
              <Button variant="outline" size="sm">Change Hotel</Button>
            </Link>
            <button
              type="button"
              className="td-hotel-remove-btn"
              onClick={onRemoveHotel}
              title="Remove hotel from this trip"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="td-hotel-empty">
          <p className="td-hotel-empty__msg">No hotel assigned to this trip yet.</p>
          <Link to={`/hotels?destination=${destId}`}>
            <Button size="sm">Find Accessible Hotels 🏨</Button>
          </Link>
        </div>
      )}
    </aside>
  )
}

/* ══════════════════════════════════════════
   MAIN TRIP DETAIL PAGE
══════════════════════════════════════════ */
function TripDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [trip,        setTrip]        = useState(null)
  const [itinerary,   setItinerary]   = useState(null)
  const [scoreData,   setScoreData]   = useState(null)
  const [attractions, setAttractions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [scoreLoading,setScoreLoading]= useState(false)
  const [error,       setError]       = useState('')
  const [regen,       setRegen]       = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [showMap,           setShowMap]           = useState(false)
  const [showEditTripModal, setShowEditTripModal] = useState(false)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [activeEditItem,    setActiveEditItem]    = useState(null)
  const [activeDayNumber,   setActiveDayNumber]   = useState(1)
  const [adapting,          setAdapting]          = useState(false)

  const fetchData = async () => {
    try {
      const [tripRes, itiRes] = await Promise.allSettled([
        getTrip(id),
        getItinerary(id),
      ])
      if (tripRes.status === 'fulfilled') setTrip(tripRes.value.data)
      else setError('Trip not found.')
      if (itiRes.status === 'fulfilled') setItinerary(itiRes.value.data)
    } catch {
      setError('Failed to load trip.')
    } finally {
      setLoading(false)
    }
  }

  const fetchScores = async () => {
    setScoreLoading(true)
    try {
      const res = await getTripScores(id)
      setScoreData(res.data)
    } catch {
      // Non-fatal: scores may not be available yet
    } finally {
      setScoreLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])
  useEffect(() => { if (!loading && trip) fetchScores() }, [loading, trip])

  // Fetch attractions for map once destination is known
  useEffect(() => {
    if (!trip?.destination?._id) return
    getAttractions({ destination: trip.destination._id, limit: 30 })
      .then((res) => setAttractions(res.data || []))
      .catch(() => {})
  }, [trip?.destination?._id])

  const handleRegenerate = async () => {
    setRegen(true)
    try {
      const res = await generateItinerary(id)
      setItinerary(res.data)
      // Re-fetch scores after new itinerary is generated
      fetchScores()
    } catch {
      setError('Failed to regenerate itinerary.')
    } finally {
      setRegen(false)
    }
  }

  const handleRemoveHotel = async () => {
    if (!window.confirm('Remove hotel from this trip?')) return
    try {
      await assignHotelToTrip(id, null)
      fetchData()
    } catch {
      setError('Failed to remove hotel.')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return
    setDeleting(true)
    try {
      await deleteTrip(id)
      navigate('/trips')
    } catch {
      setError('Failed to delete trip.')
      setDeleting(false)
    }
  }

  // ─── Phase 9: Trip & Itinerary modification handlers ───
  const handleSaveTrip = async (formData) => {
    const res = await updateTrip(id, formData)
    setTrip(res.data)
    fetchData()
    fetchScores()
  }

  const handleSmartAdapt = async () => {
    setAdapting(true)
    try {
      const res = await adaptItinerary(id)
      setItinerary(res.data)
      if (res.scores) setScoreData((prev) => ({ ...prev, scores: res.scores }))
      fetchScores()
    } catch {
      setError('Failed to adapt itinerary timing.')
    } finally {
      setAdapting(false)
    }
  }

  const handleOpenAddItem = (day) => {
    setActiveEditItem(null)
    setActiveDayNumber(day)
    setShowEditItemModal(true)
  }

  const handleOpenEditItem = (item) => {
    setActiveEditItem(item)
    setActiveDayNumber(item.dayNumber || 1)
    setShowEditItemModal(true)
  }

  const handleSaveItem = async (itemData) => {
    if (activeEditItem) {
      const res = await modifyItineraryItem(id, activeEditItem._id, itemData)
      setItinerary(res.data)
    } else {
      const res = await addItineraryItem(id, itemData)
      setItinerary(res.data)
    }
    fetchScores()
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Remove this stop from your itinerary?')) return
    try {
      const res = await deleteItineraryItem(id, itemId)
      setItinerary(res.data)
      fetchScores()
    } catch {
      setError('Failed to delete itinerary stop.')
    }
  }

  if (loading) return <Loading message="Loading trip..." fullPage />
  if (error && !trip) return (
    <main className="container" style={{ paddingTop: '4rem' }}>
      <ErrorMessage message={error} />
      <Link to="/trips" className="td-back-link">← Back to My Trips</Link>
    </main>
  )

  // Group itinerary items by day
  const byDay = {}
  if (itinerary?.items) {
    itinerary.items.forEach((item) => {
      if (!byDay[item.dayNumber]) byDay[item.dayNumber] = []
      byDay[item.dayNumber].push(item)
    })
  }

  return (
    <main className="trip-detail-page">
      <div className="container">
        {/* Header */}
        <div className="td-header animate-fade-in">
          <div>
            <nav aria-label="Breadcrumb">
              <Link to="/trips" className="td-back-link">← My Trips</Link>
            </nav>
            <h1 className="td-title">{trip.title}</h1>
            <p className="td-subtitle">
              {trip.destination?.name} · {trip.destination?.state}
            </p>
          </div>
          <div className="td-header-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditTripModal(true)}
              id="edit-trip-btn"
            >
              ✏️ Edit Trip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSmartAdapt}
              isLoading={adapting}
              id="adapt-itinerary-btn"
              title="Recalculate times sequentially and re-score"
            >
              ⚡ Smart Adapt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              isLoading={regen}
              id="regen-itinerary-btn"
            >
              🔄 Regenerate
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleting}
              id="delete-trip-btn"
            >
              🗑️ Delete
            </Button>
          </div>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        <div className="td-layout">
          {/* Itinerary */}
          <div className="td-itinerary">
            <div className="td-itinerary-header">
              <h2 className="td-section-title">📅 Your Itinerary</h2>
              {itinerary && (
                <p className="td-itinerary-meta">
                  {itinerary.totalDays} day{itinerary.totalDays !== 1 ? 's' : ''} ·
                  Generated {new Date(itinerary.generatedAt).toLocaleDateString('en-IN')} ·
                  v{itinerary.version}
                </p>
              )}
            </div>

            {!itinerary ? (
              <div className="td-no-itinerary" role="status">
                <span aria-hidden="true">📋</span>
                <h3>No itinerary yet</h3>
                <p>Click "Regenerate Itinerary" to generate your day-wise plan.</p>
                <Button variant="primary" onClick={handleRegenerate} isLoading={regen} id="gen-itinerary-btn">
                  🗺️ Generate Itinerary
                </Button>
              </div>
            ) : (
              <>
                {/* Day-wise itinerary */}
                <div className="ti-days">
                  {Object.keys(byDay).sort((a, b) => Number(a) - Number(b)).map((day) => (
                    <DaySection
                      key={day}
                      day={Number(day)}
                      items={byDay[day]}
                      tripStartDate={trip.startDate}
                      onEditItem={handleOpenEditItem}
                      onDeleteItem={handleDeleteItem}
                      onAddItem={handleOpenAddItem}
                    />
                  ))}
                </div>

                {/* Phase 7: Interactive Map */}
                <div className="td-map-section">
                  <div className="td-map-header">
                    <h2 className="td-section-title">🗺️ Trip Map</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMap((v) => !v)}
                      id="toggle-map-btn"
                    >
                      {showMap ? '🙈 Hide Map' : '🗺️ Show Map'}
                    </Button>
                  </div>

                  {showMap && (
                    <Suspense fallback={
                      <div className="td-map-loading" role="status">
                        <div className="td-map-loading__spinner" aria-hidden="true" />
                        <p>Loading map…</p>
                      </div>
                    }>
                      <TripMap
                        destination={trip.destination}
                        attractions={attractions}
                        itinerary={itinerary}
                        height="500px"
                      />
                    </Suspense>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="td-sidebar">
            <TripSummary trip={trip} />
            <TripHotelCard trip={trip} onRemoveHotel={handleRemoveHotel} />
            <TripScoreCard
              trip={trip}
              scoreData={scoreData}
              loading={scoreLoading}
            />
          </div>
        </div>
      </div>

      {/* Phase 9 Modals */}
      <EditTripModal
        trip={trip}
        isOpen={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        onSave={handleSaveTrip}
      />

      <EditItemModal
        isOpen={showEditItemModal}
        onClose={() => setShowEditItemModal(false)}
        onSave={handleSaveItem}
        item={activeEditItem}
        defaultDay={activeDayNumber}
        totalDays={itinerary?.totalDays || 1}
      />
    </main>
  )
}

export default TripDetail
