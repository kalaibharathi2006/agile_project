import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getDestination, getAttractions } from '../../services/destinationService'
import { getDestinationScores } from '../../services/scoringService'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import { ScorePill, AccessibilityFeatures } from '../../components/AccessibilityBadge/AccessibilityBadge'
import { DestinationScoreCard } from '../../components/AccessibilityScoreCard/AccessibilityScoreCard'
import ReviewSection from '../../components/Reviews/ReviewSection'
import './DestinationDetail.css'

const DestinationMap = lazy(() => import('../../components/Map/TripMap').then(m => ({ default: m.DestinationMap })))


/* ─── Attraction card used inside detail ─── */
function AttractionCard({ attraction, onFilter }) {
  const a = attraction.accessibility || {}
  return (
    <Link
      to={`/attractions/${attraction._id}`}
      className="attr-card"
      aria-label={`${attraction.name} — ${attraction.category}`}
    >
      <div className="attr-card__header">
        <span className="attr-card__category-badge">{CATEGORY_ICON[attraction.category] || '🏛️'} {attraction.category}</span>
        <ScorePill score={a.accessibilityScore || 0} max={10} label="A11y" />
      </div>

      <h3 className="attr-card__name">{attraction.name}</h3>

      {attraction.description && (
        <p className="attr-card__desc">{attraction.description.substring(0, 100)}…</p>
      )}

      <div className="attr-card__meta">
        {attraction.openingHours && <span>⏰ {attraction.openingHours}</span>}
        {attraction.entryFee != null && (
          <span>💰 {attraction.entryFee === 0 ? 'Free' : `₹${attraction.entryFee}`}</span>
        )}
        {attraction.averageVisitDurationMinutes && (
          <span>⏱️ {attraction.averageVisitDurationMinutes} min</span>
        )}
      </div>

      <div className="attr-card__difficulty">
        <span className={`attr-card__diff-badge attr-card__diff-badge--${a.walkingDifficulty || 'moderate'}`}>
          🚶 {a.walkingDifficulty || 'moderate'}
        </span>
      </div>

      <div className="attr-card__a11y">
        {a.wheelchairAccessible && <span className="attr-card__a11y-icon" title="Wheelchair accessible">♿</span>}
        {a.elevatorAvailable    && <span className="attr-card__a11y-icon" title="Elevator available">🛗</span>}
        {a.accessibleRestroom   && <span className="attr-card__a11y-icon" title="Accessible restroom">🚻</span>}
        {a.seatingAvailable     && <span className="attr-card__a11y-icon" title="Seating available">💺</span>}
        {a.parkingAvailable     && <span className="attr-card__a11y-icon" title="Parking available">🅿️</span>}
      </div>
    </Link>
  )
}

/* ─── Attraction filter bar ─── */
const CATEGORIES = ['All', 'heritage', 'nature', 'religious', 'museum', 'park', 'beach', 'food', 'entertainment']
const DIFFICULTY  = ['All', 'easy', 'moderate', 'difficult']

const CATEGORY_ICON = {
  heritage: '🏛️', nature: '🌿', religious: '🕌', museum: '🖼️',
  park: '🌳', beach: '🏖️', shopping: '🛍️', food: '🍽️', entertainment: '🎭', other: '📍',
}

function DestinationDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [destination,  setDestination] = useState(null)
  const [attractions,  setAttractions] = useState([])
  const [destScoreData,setDestScoreData] = useState(null)
  const [destLoading,  setDestLoading] = useState(true)
  const [attrLoading,  setAttrLoading] = useState(true)
  const [error,        setError]       = useState('')

  // Attraction filters
  const [catFilter,  setCatFilter]  = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [wcOnly,     setWcOnly]     = useState(false)
  const [showMap,    setShowMap]    = useState(true)

  // Fetch destination
  useEffect(() => {
    getDestination(id)
      .then((res) => setDestination(res.data))
      .catch(() => setError('Destination not found.'))
      .finally(() => setDestLoading(false))
  }, [id])

  // Fetch destination score data once destination is loaded
  useEffect(() => {
    if (!destination) return
    getDestinationScores(id)
      .then((res) => setDestScoreData(res.data))
      .catch(() => {}) // non-fatal
  }, [destination, id])

  // Fetch attractions for this destination
  useEffect(() => {
    if (!id) return
    setAttrLoading(true)
    const params = { destination: id, limit: 50 }
    if (catFilter)  params.category             = catFilter
    if (diffFilter) params.walkingDifficulty    = diffFilter
    if (wcOnly)     params.wheelchairAccessible = 'true'
    getAttractions(params)
      .then((res) => setAttractions(res.data))
      .catch(() => {})
      .finally(() => setAttrLoading(false))
  }, [id, catFilter, diffFilter, wcOnly])

  if (destLoading) return <Loading message="Loading destination..." fullPage />
  if (error)       return (
    <main className="container" style={{ paddingTop: '4rem' }}>
      <ErrorMessage message={error} />
      <button className="dest-detail__back" onClick={() => navigate('/destinations')}>← Back to destinations</button>
    </main>
  )
  if (!destination) return null

  const score = destination.accessibilityRating ? Math.round(destination.accessibilityRating * 2) : 0

  return (
    <main className="dest-detail">
      <div className="container">
        {/* Back nav */}
        <nav aria-label="Breadcrumb" className="dest-detail__breadcrumb">
          <Link to="/destinations">← All Destinations</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{destination.name}</span>
        </nav>

        {/* Hero */}
        <section className="dest-detail__hero animate-fade-in" aria-labelledby="dest-name">
          <div className="dest-detail__hero-content">
            <div className="dest-detail__hero-top">
              <span className="dest-detail__emoji" aria-hidden="true">
                {getDestinationEmoji(destination.name)}
              </span>
              <div className="dest-detail__pills">
                <ScorePill score={score} max={10} label="Accessibility" />
                {destination.wheelchairFriendly && (
                  <span className="dest-detail__wc-pill">♿ Wheelchair Friendly</span>
                )}
                {destination.publicTransportAccessible && (
                  <span className="dest-detail__transport-pill">🚌 Public Transport</span>
                )}
              </div>
            </div>

            <h1 id="dest-name" className="dest-detail__name">{destination.name}</h1>
            <p className="dest-detail__location">📍 {destination.state}, {destination.country || 'India'}</p>

            {destination.description && (
              <p className="dest-detail__desc">{destination.description}</p>
            )}
          </div>

          {/* Info grid */}
          <div className="dest-detail__info-grid">
            {destination.climate && (
              <InfoBox icon="🌡️" label="Climate" value={destination.climate} />
            )}
            {destination.bestTimeToVisit && (
              <InfoBox icon="🗓️" label="Best Time" value={destination.bestTimeToVisit} />
            )}
            {destination.totalAttractions > 0 && (
              <InfoBox icon="🏛️" label="Attractions" value={`${destination.totalAttractions} places`} />
            )}
            <InfoBox
              icon="⭐"
              label="Accessibility Rating"
              value={`${destination.accessibilityRating}/5`}
            />
          </div>

          {/* Accessibility notes + Score Card */}
          {destination.accessibilityNotes && (
            <div className="dest-detail__a11y-notes" role="note">
              <h2 className="dest-detail__notes-title">♿ Accessibility Notes</h2>
              <p>{destination.accessibilityNotes}</p>
            </div>
          )}

          {/* Phase 6: Full Destination Accessibility Score Card */}
          <DestinationScoreCard
            destination={
              destScoreData
                ? { ...destination, ...destScoreData.scores }
                : destination
            }
          />

          {/* Attraction stats from scoring API */}
          {destScoreData?.attractionStats?.total > 0 && (
            <div className="dest-detail__attr-stats" role="region" aria-label="Attraction accessibility stats">
              <h3 className="dest-detail__stats-title">📊 Attraction Accessibility Stats</h3>
              <div className="dest-detail__stats-grid">
                <StatBox icon="♿" label="Wheelchair" value={`${destScoreData.attractionStats.wheelchairAccessible}/${destScoreData.attractionStats.total}`} />
                <StatBox icon="🛗" label="Elevator" value={`${destScoreData.attractionStats.elevatorAvailable}/${destScoreData.attractionStats.total}`} />
                <StatBox icon="🚻" label="Restroom" value={`${destScoreData.attractionStats.accessibleRestroom}/${destScoreData.attractionStats.total}`} />
                <StatBox icon="💺" label="Seating" value={`${destScoreData.attractionStats.seatingAvailable}/${destScoreData.attractionStats.total}`} />
                <StatBox icon="🟢" label="Easy Walk" value={`${destScoreData.attractionStats.easyWalking}/${destScoreData.attractionStats.total}`} />
                <StatBox icon="⭐" label="Avg Score" value={`${destScoreData.attractionStats.avgAttractionScore}/10`} />
              </div>
            </div>
          )}
        </section>

        {/* Attractions */}
        <section className="dest-detail__attractions" aria-labelledby="attractions-heading">
          <div className="dest-detail__attractions-header">
            <h2 id="attractions-heading" className="dest-detail__section-title">
              Attractions in {destination.name}
            </h2>
            <div className="dest-detail__header-actions">
              <span className="dest-detail__count">
                {attrLoading ? '...' : `${attractions.length} found`}
              </span>
              <button
                type="button"
                className="dest-detail__map-toggle-btn"
                onClick={() => setShowMap((v) => !v)}
              >
                {showMap ? '🗺️ Hide Map' : '🗺️ View Map'}
              </button>
            </div>
          </div>

          {/* Phase 7: Interactive Destination & Attractions Map */}
          {showMap && (
            <div className="dest-detail__map-section">
              <Suspense fallback={
                <div className="dest-detail__map-loading">
                  <div className="dest-detail__map-spinner" aria-hidden="true" />
                  <p>Loading interactive map…</p>
                </div>
              }>
                <DestinationMap
                  destination={destination}
                  attractions={attractions}
                  height="360px"
                />
              </Suspense>
            </div>
          )}

          {/* Attraction filters */}
          <div className="dest-detail__attr-filters" role="group" aria-label="Filter attractions">
            <div className="dest-detail__filter-chips">
              <span className="dest-detail__filter-label">Category:</span>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`dest-detail__chip ${catFilter === (c === 'All' ? '' : c) ? 'dest-detail__chip--active' : ''}`}
                  onClick={() => setCatFilter(c === 'All' ? '' : c)}
                  aria-pressed={catFilter === (c === 'All' ? '' : c)}
                >
                  {CATEGORY_ICON[c] || ''} {c}
                </button>
              ))}
            </div>

            <div className="dest-detail__filter-chips">
              <span className="dest-detail__filter-label">Difficulty:</span>
              {DIFFICULTY.map((d) => (
                <button
                  key={d}
                  className={`dest-detail__chip ${diffFilter === (d === 'All' ? '' : d) ? 'dest-detail__chip--active' : ''}`}
                  onClick={() => setDiffFilter(d === 'All' ? '' : d)}
                  aria-pressed={diffFilter === (d === 'All' ? '' : d)}
                >
                  {d}
                </button>
              ))}
            </div>

            <label className="dest-detail__wc-filter" htmlFor="attr-wc-filter">
              <input
                id="attr-wc-filter"
                type="checkbox"
                checked={wcOnly}
                onChange={(e) => setWcOnly(e.target.checked)}
              />
              <span>♿ Wheelchair accessible only</span>
            </label>
          </div>

          {attrLoading ? (
            <Loading message="Loading attractions..." />
          ) : attractions.length === 0 ? (
            <div className="dest-detail__empty" role="status">
              <span aria-hidden="true">🔍</span>
              <p>No attractions match your filters. <button className="dest-detail__link-btn" onClick={() => { setCatFilter(''); setDiffFilter(''); setWcOnly(false) }}>Clear filters</button></p>
            </div>
          ) : (
            <div className="dest-detail__attr-grid">
              {attractions.map((attr) => (
                <AttractionCard key={attr._id} attraction={attr} />
              ))}
            </div>
          )}
        </section>

        {/* Phase 10: Reviews & Accessibility Verification */}
        <ReviewSection
          entityType="destination"
          entityId={destination._id}
          entityName={destination.name}
        />
      </div>
    </main>
  )
}

function InfoBox({ icon, label, value }) {
  return (
    <div className="dest-detail__info-box">
      <span className="dest-detail__info-icon" aria-hidden="true">{icon}</span>
      <div>
        <p className="dest-detail__info-label">{label}</p>
        <p className="dest-detail__info-value">{value}</p>
      </div>
    </div>
  )
}

function getDestinationEmoji(name) {
  const map = {
    chennai: '🌊', ooty: '🌿', madurai: '🕌', thanjavur: '🏯',
    coimbatore: '🏭', tiruchirappalli: '🏛️', bengaluru: '🌆',
    kochi: '🌴', mysuru: '🏰', jaipur: '🎪', goa: '🏖️',
  }
  return map[name?.toLowerCase()] || '🗺️'
}

function StatBox({ icon, label, value }) {
  return (
    <div className="dest-detail__stat-box">
      <span className="dest-detail__stat-icon" aria-hidden="true">{icon}</span>
      <div>
        <p className="dest-detail__stat-value">{value}</p>
        <p className="dest-detail__stat-label">{label}</p>
      </div>
    </div>
  )
}

export default DestinationDetail
