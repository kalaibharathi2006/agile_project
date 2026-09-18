import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getHotels } from '../../services/hotelService'
import { getDestinations } from '../../services/destinationService'
import Loading from '../../components/Loading/Loading'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import Button from '../../components/Button/Button'
import { ScorePill } from '../../components/AccessibilityBadge/AccessibilityBadge'
import './Hotels.css'

const PRICE_CATEGORIES = ['All', 'budget', 'mid-range', 'luxury']
const STAR_OPTIONS = [
  { label: 'All Stars', value: '' },
  { label: '3+ Stars', value: '3' },
  { label: '4+ Stars', value: '4' },
  { label: '5 Stars only', value: '5' },
]

const SORT_OPTIONS = [
  { label: 'Accessibility Score', value: 'a11y' },
  { label: 'Guest Rating', value: 'rating' },
  { label: 'Price: Low to High', value: 'priceAsc' },
  { label: 'Price: High to Low', value: 'priceDesc' },
]

const A11Y_TOGGLES = [
  { key: 'wheelchairAccessible', label: 'Wheelchair Access', icon: '♿' },
  { key: 'elevatorAvailable',    label: 'Elevator / Lift',  icon: '🛗' },
  { key: 'accessibleRooms',       label: 'Accessible Rooms', icon: '🛏️' },
  { key: 'accessibleRestroom',    label: 'Accessible Bath',  icon: '🚻' },
  { key: 'rampAccess',            label: 'Step-Free Ramps',  icon: '🛹' },
  { key: 'parkingAvailable',      label: 'Accessible Park',  icon: '🅿️' },
]

function HotelCard({ hotel }) {
  const a = hotel.accessibility || {}

  return (
    <article className="hotel-card" aria-label={`${hotel.name} - ${hotel.starRating} star hotel`}>
      <div className="hotel-card__media">
        <div className="hotel-card__fallback-img" aria-hidden="true">
          <span className="hotel-card__emoji">🏨</span>
        </div>
        <div className="hotel-card__badges-overlay">
          <span className="hotel-card__stars">{'⭐'.repeat(hotel.starRating || 3)}</span>
          <span className={`hotel-card__price-badge hotel-card__price-badge--${hotel.priceCategory}`}>
            {hotel.priceCategory}
          </span>
        </div>
      </div>

      <div className="hotel-card__body">
        <div className="hotel-card__header">
          <div>
            <h3 className="hotel-card__title">
              <Link to={`/hotels/${hotel._id}`}>{hotel.name}</Link>
            </h3>
            <p className="hotel-card__location">
              📍 {hotel.destination?.name ? `${hotel.destination.name}, ${hotel.destination.state}` : hotel.address || 'India'}
            </p>
          </div>
          <ScorePill score={a.accessibilityScore || 7} max={10} label="A11y" />
        </div>

        <p className="hotel-card__desc">{hotel.description}</p>

        {/* Accessibility features checklist */}
        <div className="hotel-card__a11y-tags" role="list" aria-label="Accessibility features">
          {a.wheelchairAccessible && <span className="hotel-tag hotel-tag--green" role="listitem">♿ Wheelchair</span>}
          {a.elevatorAvailable    && <span className="hotel-tag hotel-tag--blue" role="listitem">🛗 Elevator</span>}
          {a.accessibleRooms      && <span className="hotel-tag hotel-tag--indigo" role="listitem">🛏️ Accessible Rooms</span>}
          {a.accessibleRestroom   && <span className="hotel-tag hotel-tag--purple" role="listitem">🚻 Roll-in Bath</span>}
          {a.rampAccess           && <span className="hotel-tag hotel-tag--teal" role="listitem">🛹 Ramps</span>}
          {a.parkingAvailable     && <span className="hotel-tag hotel-tag--gray" role="listitem">🅿️ Parking</span>}
        </div>

        <div className="hotel-card__footer">
          <div className="hotel-card__pricing">
            <span className="hotel-card__price">₹{(hotel.pricePerNight || 0).toLocaleString('en-IN')}</span>
            <span className="hotel-card__per-night"> / night</span>
            {hotel.rating > 0 && (
              <span className="hotel-card__rating">★ {hotel.rating} ({hotel.reviewCount || 0})</span>
            )}
          </div>
          <Link to={`/hotels/${hotel._id}`}>
            <Button size="sm">View Details</Button>
          </Link>
        </div>
      </div>
    </article>
  )
}

function Hotels() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [hotels, setHotels]             = useState([])
  const [destinations, setDestinations] = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  // Filter states initialized from URL params if present
  const [search, setSearch]             = useState(searchParams.get('search') || '')
  const [selectedDest, setSelectedDest] = useState(searchParams.get('destination') || '')
  const [priceCat, setPriceCat]         = useState(searchParams.get('priceCategory') || 'All')
  const [starRating, setStarRating]     = useState(searchParams.get('starRating') || '')
  const [sortBy, setSortBy]             = useState(searchParams.get('sort') || 'a11y')

  // Accessibility flags
  const [a11yFilters, setA11yFilters]   = useState({
    wheelchairAccessible: searchParams.get('wheelchairAccessible') === 'true',
    elevatorAvailable:    searchParams.get('elevatorAvailable') === 'true',
    accessibleRooms:       searchParams.get('accessibleRooms') === 'true',
    accessibleRestroom:    searchParams.get('accessibleRestroom') === 'true',
    rampAccess:            searchParams.get('rampAccess') === 'true',
    parkingAvailable:      searchParams.get('parkingAvailable') === 'true',
  })

  // Load destinations for the dropdown
  useEffect(() => {
    getDestinations({ limit: 50 })
      .then((res) => setDestinations(res.data || []))
      .catch(() => {})
  }, [])

  // Fetch hotels
  const fetchHotels = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        sort: sortBy,
        limit: 30,
      }
      if (search.trim()) params.search = search.trim()
      if (selectedDest) params.destination = selectedDest
      if (priceCat !== 'All') params.priceCategory = priceCat
      if (starRating) params.starRating = starRating

      // Add a11y flags
      Object.keys(a11yFilters).forEach((key) => {
        if (a11yFilters[key]) params[key] = 'true'
      })

      const res = await getHotels(params)
      setHotels(res.data || [])
      setTotal(res.total || 0)
    } catch {
      setError('Unable to load hotels. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [search, selectedDest, priceCat, starRating, sortBy, a11yFilters])

  useEffect(() => {
    fetchHotels()
  }, [fetchHotels])

  const toggleA11y = (key) => {
    setA11yFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedDest('')
    setPriceCat('All')
    setStarRating('')
    setSortBy('a11y')
    setA11yFilters({
      wheelchairAccessible: false,
      elevatorAvailable: false,
      accessibleRooms: false,
      accessibleRestroom: false,
      rampAccess: false,
      parkingAvailable: false,
    })
  }

  const activeA11yCount = Object.values(a11yFilters).filter(Boolean).length

  return (
    <main className="hotels-page" id="main-content">
      {/* Hero Banner */}
      <section className="hotels-hero">
        <div className="container hotels-hero__content">
          <div className="hotels-hero__badge" role="text">
            <span>🏨</span> Phase 8: Accessible Accommodations
          </div>
          <h1 className="hotels-hero__title">
            Discover Barrier-Free <span className="text-gradient">Hotels & Stays</span>
          </h1>
          <p className="hotels-hero__sub">
            Verified step-free access, roll-in showers, visual alert systems, and elevators tailored for every traveler.
          </p>
        </div>
      </section>

      <div className="container hotels-layout">
        {/* Search & Filter Bar */}
        <section className="hotels-filters-card" aria-label="Hotel search and filters">
          <div className="hotels-filters-top">
            <div className="hotels-search-input">
              <span className="hotels-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                placeholder="Search hotel name, neighborhood..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search hotels by name or location"
              />
              {search && (
                <button
                  type="button"
                  className="hotels-clear-input-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="hotels-select-group">
              <label htmlFor="dest-filter" className="sr-only">Destination</label>
              <select
                id="dest-filter"
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
                className="hotels-select"
              >
                <option value="">All Destinations</option>
                {destinations.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.state})</option>
                ))}
              </select>

              <label htmlFor="price-filter" className="sr-only">Price Category</label>
              <select
                id="price-filter"
                value={priceCat}
                onChange={(e) => setPriceCat(e.target.value)}
                className="hotels-select"
              >
                {PRICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Prices' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>

              <label htmlFor="star-filter" className="sr-only">Star Rating</label>
              <select
                id="star-filter"
                value={starRating}
                onChange={(e) => setStarRating(e.target.value)}
                className="hotels-select"
              >
                {STAR_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <label htmlFor="sort-filter" className="sr-only">Sort by</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="hotels-select"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>Sort: {s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Accessibility Pill Toggles */}
          <div className="hotels-a11y-filters">
            <span className="hotels-a11y-label">Accessibility:</span>
            <div className="hotels-a11y-chips" role="group" aria-label="Filter by accessibility features">
              {A11Y_TOGGLES.map((t) => {
                const active = a11yFilters[t.key]
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`hotels-a11y-chip ${active ? 'hotels-a11y-chip--active' : ''}`}
                    onClick={() => toggleA11y(t.key)}
                    aria-pressed={active}
                  >
                    <span aria-hidden="true">{t.icon}</span>
                    <span>{t.label}</span>
                    {active && <span className="hotels-chip-check">✓</span>}
                  </button>
                )
              })}
            </div>

            {(search || selectedDest || priceCat !== 'All' || starRating || activeA11yCount > 0) && (
              <button
                type="button"
                className="hotels-reset-btn"
                onClick={handleClearFilters}
              >
                Reset Filters
              </button>
            )}
          </div>
        </section>

        {/* Results Info */}
        <div className="hotels-results-header">
          <h2 className="hotels-results-count">
            {loading ? 'Finding accessible hotels…' : `${total} hotel${total !== 1 ? 's' : ''} available`}
          </h2>
          {selectedDest && (
            <span className="hotels-active-dest">
              in {destinations.find(d => d._id === selectedDest)?.name}
            </span>
          )}
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Loading message="Searching barrier-free accommodations..." />
        ) : hotels.length === 0 ? (
          <div className="hotels-empty" role="status">
            <span className="hotels-empty__icon" aria-hidden="true">🏨</span>
            <h3>No hotels match your current filters</h3>
            <p>Try clearing some accessibility or price filters to see more recommendations.</p>
            <Button variant="outline" onClick={handleClearFilters}>Clear all filters</Button>
          </div>
        ) : (
          <div className="hotels-grid">
            {hotels.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default Hotels
